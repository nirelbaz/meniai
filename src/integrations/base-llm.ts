import debugProvider from 'debug';
import { Ora } from 'ora';
import chalk from 'chalk';
import { config } from '../config/config.js';
import { assistantLoading, blankLine, printSystemMessage } from '../cli/chat.js';
import { Config, Context, MessageEntry, Role } from '../types.js';

const debug = debugProvider('MeniAI:BaseLLM');

const LOADING_MESSAGES = ['Thinking', 'Let me see what I can do', 'Just a moment please', 'On it', 'Executing'];

export abstract class BaseLLM {
  protected context: Context | string;
  protected conversationHistory: MessageEntry[];
  protected abortController: AbortController;
  protected spinner?: Ora;
  public aborted = false;

  constructor(context: Context | string) {
    this.context = context;
    this.conversationHistory = [];
    this.abortController = new AbortController();
  }

  get config(): Config {
    return typeof this.context === 'string' ? config : this.context.config;
  }

  get systemMessage(): string {
    return typeof this.context === 'string' ? this.context : this.context.systemMessage.getSystemMessage();
  }

  async sendMessage(messages: string[], printStreamToChat = true, action: string | null = null, retries = 10): Promise<string> {
    try {
      const messagesEntries: MessageEntry[] = messages.map((msg) => ({ role: 'user', content: msg }));
      const fullConversation = [...this.conversationHistory, ...messagesEntries];

      this.logDebugInfo(fullConversation);

      this.aborted = false;
      process.on('SIGINT', () => this.abortMessage());
      this.startSpinner(action);
      const completion = await this.createChatCompletion(fullConversation, printStreamToChat);
      this.stopSpinner(action ? 'success' : 'stop');

      const assistantMessage = await this.handleChatCompletionResponse(completion, printStreamToChat);
      process.off('SIGINT', () => this.abortMessage());

      if (this.aborted) {
        throw new Error('Request was aborted.');
      }

      this.validateAssistantMessage(assistantMessage);
      this.updateConversationHistory(messagesEntries, assistantMessage);

      return assistantMessage;
    } catch (error: unknown) {
      this.stopSpinner(action ? 'fail' : 'stop');

      const errorMessage = this.handleError(error);
      if (errorMessage === 'aborted') {
        return 'aborted';
      }

      if (retries > 0) {
        await printSystemMessage(`${chalk.red(`Error: ${errorMessage}.`)} Retrying... (${retries} attempts left)`, false);
        debug(`Error: ${errorMessage}. Retrying... (${retries} attempts left)`);
        return this.sendMessage(messages, printStreamToChat, action, retries - 1);
      }

      throw new Error(`Max retries reached. Last error: ${errorMessage}`);
    }
  }

  addMessageToConversationHistory(message: string, role: Role = 'user'): void {
    this.conversationHistory.push({ role, content: message });
  }

  abortMessage(): void {
    this.aborted = true;
    this.abortController?.abort();
    this.abortController = new AbortController();
  }

  protected abstract initializeClient(): void;

  protected abstract createChatCompletion(messages: MessageEntry[], stream: boolean): Promise<unknown>;

  protected abstract handleChatCompletionResponse(completion: unknown, printStreamToChat: boolean): Promise<string>;

  protected handleError(error: unknown): string {
    const errorMessage = this.getErrorMessage(error);

    if (errorMessage === 'Request was aborted.') {
      debug('Conversation aborted');
      return 'aborted';
    }

    debug('Error occurred:', error);
    return errorMessage;
  }

  private logDebugInfo(fullConversation: MessageEntry[]): void {
    if (this.config.debug) {
      debug('fullConversation', fullConversation);
    }
  }

  private startSpinner(action: string | null = null): void {
    this.spinner = assistantLoading(`${action || LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]}...`);
  }

  private stopSpinner(result: 'success' | 'fail' | 'stop'): void {
    if (result === 'success') {
      this.spinner?.succeed();
      blankLine();
    } else if (result === 'fail') {
      this.spinner?.fail();
      blankLine();
    } else {
      this.spinner?.stop();
    }
  }

  private validateAssistantMessage(assistantMessage: string): void {
    if (!assistantMessage) {
      throw new Error('Assistant returned an empty response');
    }
  }

  private updateConversationHistory(messagesEntries: MessageEntry[], assistantMessage: string): void {
    this.conversationHistory.push(...messagesEntries, { role: 'assistant', content: assistantMessage });
  }

  protected getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : typeof error === 'string' ? error : 'An unknown error occurred';
  }
}
