import OpenAI from 'openai';
import debugProvider from 'debug';
import { Stream } from 'openai/streaming';
import { ChatCompletion, ChatCompletionChunk } from 'openai/resources/chat/completions.js';
import { Context, MessageEntry } from '../types.js';
import { createAssistantFileStreamHandler } from '../cli/file-stream-handler.js';
import { BaseLLM } from './base-llm.js';

const debug = debugProvider('MeniAI:ChatGPT');
const DEFAULT_MODEL = 'gpt-4o-mini';

export class ChatGPT extends BaseLLM {
  private client!: OpenAI;

  constructor(context: Context | string) {
    super(context);
    this.initializeClient();
  }

  protected initializeClient(): void {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    if (this.systemMessage) {
      this.conversationHistory.push({ role: 'system', content: this.systemMessage });
    }
  }

  protected async createChatCompletion(messages: MessageEntry[], stream: boolean): Promise<ChatCompletion | Stream<ChatCompletionChunk>> {
    return this.client.chat.completions.create(
      {
        model: this.config.model || DEFAULT_MODEL,
        messages,
        stream
      },
      { signal: this.abortController.signal }
    );
  }

  protected handleError(error: unknown): string {
    const errorMessage = this.getErrorMessage(error);

    if (this.isMaxContextLengthError(errorMessage)) {
      this.removeOldestUserMessage();
    }

    return super.handleError(error);
  }

  protected async handleChatCompletionResponse(
    completion: ChatCompletion | Stream<ChatCompletionChunk>,
    printStreamToChat: boolean
  ): Promise<string> {
    return printStreamToChat
      ? this.handleStreamResponse(completion as Stream<ChatCompletionChunk>)
      : this.handleNonStreamResponse(completion as ChatCompletion);
  }

  private isMaxContextLengthError(errorMessage: string): boolean {
    return errorMessage.includes("400 This model's maximum context length");
  }

  private removeOldestUserMessage(): void {
    debug('Maximum context length exceeded. Removing oldest user message.');
    const userMessageIndex = this.conversationHistory.findIndex((message) => message.role === 'user');
    if (userMessageIndex > -1) {
      this.conversationHistory.splice(userMessageIndex, 1);
    }
  }

  private async handleStreamResponse(completion: Stream<ChatCompletionChunk>): Promise<string> {
    const { streamChunkContent, stopStream } = createAssistantFileStreamHandler(
      this.config.fileContentStartBoundary,
      this.config.fileContentEndBoundary
    );
    let message = '';

    try {
      for await (const chunk of completion) {
        const content = chunk.choices[0].delta.content || '';
        message += content;
        streamChunkContent(content);
      }
    } catch (error) {
      stopStream();
      throw error;
    }

    stopStream();
    this.logDebugMessage(message);
    return message;
  }

  private handleNonStreamResponse(completion: ChatCompletion): string {
    const message = completion.choices[0].message.content || '';
    this.logDebugMessage(message);
    return message;
  }

  private logDebugMessage(message: string): void {
    if (this.config.debug) {
      debug('printAssistantMessage', message);
    }
  }
}
