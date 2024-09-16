import debugProvider from 'debug';
import chalk from 'chalk';
import { readFile } from '../utils/file-system.js';
import { TasksProvider } from './tasks-provider.js';
import { printAssistantMessage, yesNoQuestion } from '../cli/chat.js';
import { TaskFeedbackLoop } from './task-feedback-loop.js';
import { BaseLLM } from '../integrations/base-llm.js';
import { PluginManager } from '../plugins/plugin-manager.js';
import type { Context, Config, Task } from '../types.js';

const chalkInstance = new chalk.Instance({ level: 3 });
const debug = debugProvider('MeniAI:TasksProcessor');

export class TasksProcessor {
  private context: Context;
  private llm: BaseLLM;
  private pluginManager: PluginManager;
  public fileChangedCount = 0;

  constructor(context: Context, llm: BaseLLM, pluginManager: PluginManager) {
    this.context = context;
    this.llm = llm;
    this.pluginManager = pluginManager;
  }

  get config(): Config {
    return this.context.config;
  }

  async processTasks(): Promise<void> {
    const { name, inputDir } = this.config;

    await printAssistantMessage(`Hey! I'm ${name}, your MeniAI assistant for automating menial tasks.`);

    const tasksProvider = new TasksProvider(this.config);
    this.context.tasks = await tasksProvider.getTasks();

    if (Object.keys(this.context.tasks).length === 0) {
      await printAssistantMessage('Sorry, I could not find any tasks to process. Please make sure you have files in the input directory.');
      return;
    }

    await printAssistantMessage(
      `I've found ${chalkInstance.green(Object.keys(this.context.tasks).length)} tasks for me to process in the ${chalk.blueBright(inputDir)} directory. Let's start!`
    );

    for (let iteration = 0; iteration < this.config.iterations; iteration++) {
      await this.pluginManager.runHook('beforeIteration', this.context);

      for (const taskName in this.context.tasks) {
        await this.processTask(taskName, this.context.tasks[taskName]);
      }

      await this.pluginManager.runHook('afterIteration', this.context);
    }
  }

  private async processTask(taskName: string, task: Task): Promise<void> {
    await this.pluginManager.runHook('beforeTaskProcess', this.context, task);

    if (this.config.interactive && this.config.askBeforeProceeding) {
      const shouldProceed = await yesNoQuestion(`Should I proceed with ${chalk.blueBright(taskName)}?`);
      if (!shouldProceed) return;
    }

    if (!this.validateTask(task)) return;

    await printAssistantMessage(
      `Processing ${chalk.blueBright(task.name)} task with ${chalk.green(task.relevantFilesPaths.length)} relevant files.`
    );

    const taskFilesContentMap = await this.readTaskFiles(task.relevantFilesPaths);
    let existFileContent: string | undefined;

    if (task.existingOutputFilePath && !task.relevantFilesPaths.includes(task.existingOutputFilePath)) {
      existFileContent = await readFile(task.existingOutputFilePath);
    }

    const taskMessage = this.parseTaskMessage(task, taskFilesContentMap, existFileContent);
    const taskFeedbackLoop = new TaskFeedbackLoop(taskMessage, task, this.llm, this.pluginManager, this.context);
    await taskFeedbackLoop.execute();
    this.fileChangedCount++;

    await this.pluginManager.runHook('afterTaskProcess', this.context, task);
  }

  private validateTask(task: Task): boolean {
    const { relevantFilesPaths, existingOutputFilePath, outputFilePath, outputFile } = task;

    if (relevantFilesPaths.length === 0) {
      debug('No relevant files found. Skipping.');
      return false;
    }

    if (!outputFilePath || !outputFile) {
      debug('Missing output file information. Skipping.');
      return false;
    }

    if (!existingOutputFilePath && this.config.mode === 'update') {
      debug('No existing files found. Skipping because mode is set to "update".');
      return false;
    } else if (existingOutputFilePath && this.config.mode === 'generate') {
      debug('Existing files found. Skipping because mode is set to "generate".');
      return false;
    }

    return true;
  }

  private async readTaskFiles(filePaths: string[]): Promise<Record<string, string>> {
    const contents = await Promise.all(filePaths.map((filePath) => readFile(filePath)));
    return filePaths.reduce(
      (acc, filePath, index) => {
        if (contents[index]) {
          acc[filePath] = contents[index] as string;
        }
        return acc;
      },
      {} as Record<string, string>
    );
  }

  private parseTaskMessage(task: Task, taskFilesContentMap: Record<string, string>, existFileContent?: string): string {
    const { relevantFilesPaths, outputFilePath, name: taskName } = task;

    const relevantFilesContent = relevantFilesPaths.map(
      (filePath) =>
        `${filePath}:\n${this.config.fileContentStartBoundary}\n${taskFilesContentMap[filePath]}\n${this.config.fileContentEndBoundary}`
    );

    const existingOutputFileContent = existFileContent
      ? `And here is the existing file content: \n${task.existingOutputFilePath}\n${this.config.fileContentStartBoundary}\n${existFileContent}\n${this.config.fileContentEndBoundary}`
      : '';

    return `Please ${existFileContent ? 'refactor validate and improve the' : 'generate a'} ${outputFilePath} file for "${taskName}".
Use the example files as a template but use as the task's files to decide on the best content and file.

Here are the relevant files:
${relevantFilesContent.join('\n\n')}

${existingOutputFileContent}`;
  }
}
