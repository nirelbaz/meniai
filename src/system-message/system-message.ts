import { dirname, resolve } from 'path';
import debugProvider from 'debug';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import { readFile, writeFile } from '../utils/file-system.js';
import { config } from '../config/config.js';
import { llmProvider } from '../integrations/llm-provider.js';
import { LLMProvider } from '../types.js';
import { BaseLLM } from '../integrations/base-llm.js';
import { printSystemMessage } from '../cli/chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const debug = debugProvider('MeniAI:SystemMessage');

export interface SystemMessage {
  assistantSystemMessage?: string;
  append: (message: string) => Promise<void>;
  getSystemMessage: () => string;
  reset: () => void;
  adjustSystemMessage: (userFeedbacks: string[]) => Promise<void>;
}

export const parseOutputGuidance = (): string => `REMEMBER:
* Only modify the file in question.
* Always include all the file content in your response.
* Do not add the markdown syntax to wrap the code (three \`).
* Do not add the file name or any other metadata on the top or bottom of the file.
* Always(!) response using the boundaries markers to wrap the code and with the following format:
{Short line saying what you are about to do (e.g. "Refactoring the code to improve readability and ...")}
${config.fileContentStartBoundary}
{The file code or content here}
${config.fileContentEndBoundary}
{In bullet points explain what you did or changed in the file and why starting with a sentence like "\nHere is the summary of my changes:"}`;

export class SystemMessageManager implements SystemMessage {
  public assistantSystemMessage?: string;
  private systemMessageAppendix: string = '';
  private systemMessageFilePath: string;
  private adjustSystemMessageLlm?: BaseLLM;

  constructor(assistantSystemMessage?: string) {
    this.assistantSystemMessage = assistantSystemMessage;
    const kebabCaseName = config.name.toLowerCase().replace(/\s+/g, '-');
    this.systemMessageFilePath = resolve(process.cwd(), `${config.meniaiDirectory}/${kebabCaseName}/system-message.txt`);

    this.initAdjustSystemMessageLlm();
  }

  async initAdjustSystemMessageLlm(): Promise<void> {
    const mergePrompt = await readFile(resolve(__dirname, '../../prompts/system-message-summarizer.txt'));
    if (!mergePrompt) {
      throw new Error('Required prompts not found');
    }

    this.adjustSystemMessageLlm = llmProvider(config.llm, mergePrompt);
  }

  getSystemMessage(): string {
    return `${this.assistantSystemMessage || ''}\n${parseOutputGuidance()}\n${this.systemMessageAppendix}`;
  }

  async append(message: string): Promise<void> {
    this.systemMessageAppendix += `\n\n${message}`;
    if (config.systemMessageAppendixMaxLength && this.systemMessageAppendix.length > config.systemMessageAppendixMaxLength) {
      await printSystemMessage(
        `${chalk.yellow.bold('[Attention]')} System message appendix is too long. It will be truncated to ${config.systemMessageAppendixMaxLength} characters. You can adjust this limit by setting the systemMessageAppendixMaxLength in the config.`
      );
      this.systemMessageAppendix = this.systemMessageAppendix.slice(0, config.systemMessageAppendixMaxLength);
    }
    debug('Appended message to system message');
  }

  reset(): void {
    this.systemMessageAppendix = '';
    debug('Reset system message append');
  }

  async adjustSystemMessage(userFeedbacks: string[]): Promise<void> {
    if (!this.adjustSystemMessageLlm) {
      throw new Error('Adjust system message LLM not initialized');
    }

    const feedbackMessage = userFeedbacks.join('\n');
    const adjustedMessage = await this.adjustSystemMessageLlm.sendMessage(
      [
        `Here is the current system message:\n\n${this.assistantSystemMessage}\n\nHere are the new feedbacks for the system message: ${feedbackMessage}. Please adjust the system message based on the feedbacks. Your response should be in the same format as the original system message with no additional text or comments.`
      ],
      false,
      'Summarizing feedbacks'
    );

    this.assistantSystemMessage = adjustedMessage;
    await writeFile(this.systemMessageFilePath, this.assistantSystemMessage);
    debug('Adjusted system message from user feedbacks');
  }

  static async initialize(): Promise<SystemMessageManager> {
    try {
      const kebabCaseName = config.name.toLowerCase().replace(/\s+/g, '-');
      const filePath = resolve(process.cwd(), `${config.meniaiDirectory}/${kebabCaseName}/system-message.txt`);
      const assistantSystemMessage = await readFile(filePath, false, false);
      debug('Initialized system message');
      return new SystemMessageManager(assistantSystemMessage);
    } catch (error) {
      debug('Error initializing system message:', error);
      throw new Error('Failed to initialize system message');
    }
  }
}

export async function generateSystemMessage(llmName: LLMProvider, botName: string, description: string): Promise<string> {
  try {
    const [systemMessageAssistantPrompt, systemMessageReference] = await Promise.all([
      readFile(resolve(__dirname, '../../prompts/system-message-assistant.txt')),
      readFile(resolve(__dirname, '../../prompts/system-message-reference.txt'))
    ]);

    if (!systemMessageAssistantPrompt || !systemMessageReference) {
      throw new Error('Required prompts not found');
    }

    const llm = llmProvider(llmName, systemMessageAssistantPrompt);
    const message = `Please create a system prompt for an assistant called ${botName} and have the following role description: ${description}. Respond with the system message only.\n\n Please use the following system message as an example: ${systemMessageReference}`;

    const generatedMessage = await llm.sendMessage([message], false, 'Generating initial system message');
    debug('Generated system message for bot:', botName);
    return generatedMessage;
  } catch (error) {
    debug('Error generating system message:', error);
    throw new Error('Failed to generate system message');
  }
}
