#!/usr/bin/env node
import dotenv from 'dotenv';
import chalk from 'chalk';
import { ExamplesProvider } from './system-message/examples-provider.js';
import { TasksProcessor } from './tasks/tasks-processor.js';
import { SystemMessageManager } from './system-message/system-message.js';
import { clearTerminal, printSystemMessage, yesNoQuestion } from './cli/chat.js';
import { initializeConfig } from './config/config.js';
import { ContextFilesProvider } from './system-message/context-files-provider.js';
import { PluginManager } from './plugins/plugin-manager.js';
import { llmProvider } from './integrations/llm-provider.js';
import { GitHubIntegration } from './integrations/github.js';
import type { Context } from './types.js';

// Initialize environment variables
dotenv.config();

class MeniAI {
  private context: Context;
  private pluginManager: PluginManager;
  private llm: ReturnType<typeof llmProvider>;
  private tasksProcessor: TasksProcessor;

  constructor(context: Context) {
    this.context = context;
    this.pluginManager = new PluginManager(context.config.plugins);
    this.llm = llmProvider(context.config.llm, context);
    this.tasksProcessor = new TasksProcessor(context, this.llm, this.pluginManager);
  }

  private async handleGitHubIntegration(): Promise<void> {
    if (!this.context.config.publishPr || this.tasksProcessor.fileChangedCount === 0) {
      return;
    }

    if (!this.llm.aborted || (await yesNoQuestion('Process was aborted, do you want to create a pull request?'))) {
      const github = new GitHubIntegration(this.context, this.llm);
      await github.createPullRequest();
    }
  }

  async run(): Promise<void> {
    try {
      // Run pre-process plugins
      await this.pluginManager.runHook('preProcess', this.context);

      // Process tasks
      await this.tasksProcessor.processTasks();

      // Run post-process plugins
      await this.pluginManager.runHook('postProcess', this.context);

      // Handle GitHub integration
      await this.handleGitHubIntegration();

      await printSystemMessage('All done! 🎉');
    } catch (error) {
      throw new Error(`MeniAI execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function initializeContext(): Promise<Context> {
  try {
    const config = await initializeConfig();
    const systemMessage = await SystemMessageManager.initialize();

    const context: Context = {
      config,
      tasks: {},
      messages: [],
      systemMessage
    };

    await loadContextProviders(context);

    return context;
  } catch (error) {
    throw new Error(`Context initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function loadContextProviders(context: Context): Promise<void> {
  const examplesProvider = new ExamplesProvider(context);
  const contextFilesProvider = new ContextFilesProvider(context);

  await Promise.all([examplesProvider.getExampleMessage(), contextFilesProvider.getContextFiles()]);
}

async function main(): Promise<void> {
  try {
    clearTerminal();
    await printSystemMessage('Welcome to MeniAI! Here to help with your menial tasks.');

    const context = await initializeContext();
    const meniAI = new MeniAI(context);
    await meniAI.run();
  } catch (error) {
    console.error(chalk.red('An error occurred:'), error);
    process.exit(1);
  }
}

main();
