import debugProvider from 'debug';
import chalk from 'chalk';
import { writeFile } from '../utils/file-system.js';
import { printSystemMessage, promptUser, yesNoQuestion } from '../cli/chat.js';
import type { Task } from '../types.js';
import { Config } from '../types.js';
import { parseOutputGuidance } from '../system-message/system-message.js';
import { BaseLLM } from '../integrations/base-llm.js';
import { Context } from '../types.js';
import { PluginManager } from '../plugins/plugin-manager.js';

const debug = debugProvider('MeniAI:TaskFeedbackLoop');

export class TaskFeedbackLoop {
  private task: Task;
  private llm: BaseLLM;
  private userMessageText: string;
  private pluginManager: PluginManager;
  private context: Context;
  private userFeedbackHistory: string[] = [];

  constructor(requestMessage: string, task: Task, llm: BaseLLM, pluginManager: PluginManager, context: Context) {
    this.task = task;
    this.llm = llm;
    this.userMessageText = requestMessage;
    this.pluginManager = pluginManager;
    this.context = context;
  }

  get config(): Config {
    return this.context.config;
  }

  async execute(): Promise<void> {
    const { outputFilePath, outputFile } = this.task;

    if (!outputFilePath || !outputFile) {
      debug('Missing output file information. Skipping.');
      return;
    }

    await this.pluginManager.runHook('beforeFeedbackLoop', this.context, this.task);

    let feedback = '';
    let numberOfTries = 0;
    while (feedback.toLowerCase() !== 'done') {
      const isFileChanged = await this.processAssistantMessage(feedback);

      if (isFileChanged) {
        feedback = await this.handleAutoFeedback(numberOfTries);
      }

      if (feedback) {
        numberOfTries++;
        continue;
      }

      if (!this.config.interactive) {
        break;
      }

      feedback = await this.handleManualFeedback();
      if (feedback.toLowerCase() === 'exit') {
        process.exit(0);
      }

      await this.updateFeedbackHistory(feedback);
    }

    await this.finalizeFeedbackLoop();
  }

  private async processAssistantMessage(feedback?: string): Promise<boolean> {
    const outputGuidance = parseOutputGuidance();
    const assistantMessageText = await this.llm.sendMessage([`${feedback || this.userMessageText}\n${outputGuidance}`]);

    if (this.llm.aborted) {
      if (!this.config.interactive) {
        process.exit(0);
      }
      return false;
    }

    const fileContent = this.extractFileContent(assistantMessageText);
    if (fileContent) {
      await this.saveFile(fileContent);
      return true;
    }

    printSystemMessage(chalk.red("Error: No file content found in the assistant's message."));
    return false;
  }

  private extractFileContent(assistantMessageText: string): string | false {
    const regex = new RegExp(
      `${escapeRegExp(this.config.fileContentStartBoundary)}([\\s\\S]*?)${escapeRegExp(this.config.fileContentEndBoundary)}`,
      'g'
    );
    const match = regex.exec(assistantMessageText);
    if (!match || !match[1]) {
      return false;
    }
    return `${match[1].trim()}\n`;
  }

  private async saveFile(fileContent: string): Promise<void> {
    const { outputFilePath, outputFile, existingOutputFilePath } = this.task;
    if (outputFilePath) {
      await writeFile(outputFilePath, fileContent, 'force');
      debug(`${outputFile} file was ${existingOutputFilePath ? 'updated' : 'created'} successfully`);
    }
  }

  private async handleAutoFeedback(numberOfTries: number): Promise<string> {
    const autoFeedback = await this.pluginManager.runHook('autoFeedback', this.context, this.task);
    if (!autoFeedback) return '';

    printSystemMessage(`Auto feedback generated:\n${autoFeedback}`, false);

    const feedbackToUse = this.truncateFeedbackIfNeeded(autoFeedback);

    if (!this.config.interactive) {
      return this.handleNonInteractiveAutoFeedback(feedbackToUse, numberOfTries);
    }

    return this.handleInteractiveAutoFeedback(feedbackToUse);
  }

  private truncateFeedbackIfNeeded(feedback: string): string {
    if (feedback.length <= this.config.feedbackMaxLength) {
      return feedback;
    }

    debug(`Auto feedback is too long. Truncating from ${feedback.length} to ${this.config.feedbackMaxLength} characters.`);
    const truncatedFeedback = feedback.slice(0, this.config.feedbackMaxLength);
    printSystemMessage(`Auto feedback was truncated to ${this.config.feedbackMaxLength} characters.`, false);
    return truncatedFeedback;
  }

  private async handleNonInteractiveAutoFeedback(feedback: string, numberOfTries: number): Promise<string> {
    if (numberOfTries < this.config.feedbackMaxIterations) {
      await printSystemMessage(`Auto feedback sent to the AI for review.`);
      return feedback;
    }
    await printSystemMessage(
      `${chalk.yellow.bold('[Attention]')} Maximum feedback iterations (${this.config.feedbackMaxIterations}) reached. Exiting loop.`,
      true
    );
    return 'done';
  }

  private async handleInteractiveAutoFeedback(feedback: string): Promise<string> {
    const useAutoFeedback = await yesNoQuestion(`Do you want to use this auto-generated feedback?`);
    if (useAutoFeedback) {
      await printSystemMessage(`Auto feedback sent to the AI for review.`);
      return feedback;
    }
    return '';
  }

  private async handleManualFeedback(): Promise<string> {
    await this.pluginManager.runHook('beforeUserFeedback', this.context, this.task);
    const userFeedback = await this.getUserFeedback();
    await this.pluginManager.runHook('afterUserFeedback', this.context, this.task);
    return userFeedback;
  }

  private async updateFeedbackHistory(userFeedback: string): Promise<void> {
    if (this.config.summarizeFeedback && userFeedback && userFeedback !== 'done') {
      this.userFeedbackHistory.push(userFeedback);
    }
  }

  private async finalizeFeedbackLoop(): Promise<void> {
    if (this.config.summarizeFeedback && this.userFeedbackHistory.length > 0) {
      await this.context.systemMessage.adjustSystemMessage(this.userFeedbackHistory);
    }
    await this.pluginManager.runHook('afterFeedbackLoop', this.context, this.task);
  }

  private async getUserFeedback(): Promise<string> {
    return await promptUser(
      `Please let me know if there's anything you want me to do differently? ${chalk.gray(
        '(Type "done" to move to the next task or "exit" to abort)'
      )}`
    );
  }
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
