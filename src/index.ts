#!/usr/bin/env node
import dotenv from 'dotenv';
import { ExamplesProvider } from './system-message/examples-provider.js';
import { TasksProcessor } from './tasks/tasks-processor.js';
import { SystemMessageManager } from './system-message/system-message.js';
import { clearTerminal, printSystemMessage, yesNoQuestion } from './cli/chat.js';
import { initializeConfig } from './config/config.js';
import { ContextFilesProvider } from './system-message/context-files-provider.js';
import { PluginManager } from './plugins/plugin-manager.js';
import { llmProvider } from './integrations/llm-provider.js';
import type { Context } from './types.js';
import { GitHubIntegration } from './integrations/github.js';
import chalk from 'chalk';

dotenv.config();

async function initializeContext(): Promise<Context> {
  const config = await initializeConfig();
  const systemMessage = await SystemMessageManager.initialize();

  const context: Context = {
    config,
    tasks: {},
    messages: [],
    systemMessage
  };

  const examplesProvider = new ExamplesProvider(context);
  await examplesProvider.getExampleMessage();

  const contextFilesProvider = new ContextFilesProvider(context);
  await contextFilesProvider.getContextFiles();

  return context;
}

async function main() {
  clearTerminal();
  await printSystemMessage('Welcome to MeniAI! Here to help with your menial tasks.');

  const context = await initializeContext();
  const llm = llmProvider(context.config.llm, context);

  // Initialize tasks processor with plugin manager and context
  const pluginManager = new PluginManager(context.config.plugins);
  const tasksProcessor = new TasksProcessor(context, llm, pluginManager);

  // Run pre-process plugins
  await pluginManager.runHook('preProcess', context);

  // Process tasks
  await tasksProcessor.processTasks();

  // Run post-process plugins
  await pluginManager.runHook('postProcess', context);

  // Publish to GitHub
  if (context.config.publishPr && tasksProcessor.fileChangedCount > 0) {
    if (!llm.aborted || (await yesNoQuestion('Process was aborted, do you want to create a pull request?'))) {
      const github = new GitHubIntegration(context, llm);
      await github.createPullRequest();
    }
  }

  await printSystemMessage('All done! 🎉');
}

main().catch((error) => {
  console.error(chalk.red('An error occurred:'), error);
  process.exit(1);
});
