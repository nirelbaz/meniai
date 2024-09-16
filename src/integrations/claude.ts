import debugProvider from 'debug';
import Anthropic from '@anthropic-ai/sdk';
import { Context, MessageEntry } from '../types.js';
import { BaseLLM } from './base-llm.js';
import { createAssistantFileStreamHandler } from '../cli/file-stream-handler.js';

const debug = debugProvider('MeniAI:Claude');
const DEFAULT_MODEL = 'claude-3-5-sonnet-20240620';

export class Claude extends BaseLLM {
  private client!: Anthropic;

  constructor(context: Context | string) {
    super(context);
    this.initializeClient();
  }

  protected initializeClient(): void {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  protected async createChatCompletion(
    messages: MessageEntry[],
    stream: boolean
  ): Promise<Anthropic.Message | AsyncIterable<Anthropic.MessageStreamEvent>> {
    const model = this.config.model || DEFAULT_MODEL;
    const maxTokens = this.getMaxTokens(model);
    const anthropicMessages = this.formatMessages(messages);

    const body = {
      model,
      max_tokens: maxTokens,
      system: this.systemMessage,
      messages: anthropicMessages
    };

    const options = {
      signal: this.abortController.signal
    };

    if (stream) {
      const stream = await this.client.messages.stream(body, options);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for the stream to start so we can see the spinner
      return stream;
    }

    return this.client.messages.create(body, options);
  }

  protected async handleChatCompletionResponse(
    completion: Anthropic.Message | AsyncIterable<Anthropic.MessageStreamEvent>,
    printStreamToChat: boolean
  ): Promise<string> {
    return printStreamToChat
      ? this.handleStreamingResponse(completion as AsyncIterable<Anthropic.MessageStreamEvent>)
      : this.handleNonStreamingResponse(completion as Anthropic.Message);
  }

  protected handleError(error: unknown): string {
    if (error instanceof Anthropic.APIError) {
      debug('Anthropic API Error:', error.message);
    }
    return super.handleError(error);
  }

  private getMaxTokens(model: string): number {
    return model === 'claude-3-5-sonnet-20240620' ? 8192 : 4096;
  }

  private formatMessages(messages: MessageEntry[]): Anthropic.MessageParam[] {
    return messages.map((msg) => ({
      role: msg.role === 'system' ? 'assistant' : msg.role,
      content: msg.content
    }));
  }

  private async handleStreamingResponse(completion: AsyncIterable<Anthropic.MessageStreamEvent>): Promise<string> {
    const { streamChunkContent, stopStream } = createAssistantFileStreamHandler(
      this.config.fileContentStartBoundary,
      this.config.fileContentEndBoundary
    );
    let message = '';

    try {
      for await (const event of completion) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const content = event.delta.text || '';
          message += content;
          streamChunkContent(content);
        }
      }
    } catch (error) {
      stopStream();
      throw error;
    }

    stopStream();
    this.logDebugMessage(message);
    return message;
  }

  private handleNonStreamingResponse(completion: Anthropic.Message): string {
    const message = completion.content[0].type === 'text' ? completion.content[0].text : '';
    this.logDebugMessage(message);
    return message;
  }

  private logDebugMessage(message: string): void {
    if (this.config.debug) {
      debug('printAssistantMessage', message);
    }
  }
}
