import type { SystemMessage } from './system-message/system-message.js';
import type { Plugin } from './plugins/plugin-manager.js';

export type Mode = 'update' | 'generate' | 'both';

export type TaskDivideBy = 'folder' | 'file' | 'name';

export type Role = 'user' | 'assistant' | 'system';

export type MessageEntry = {
  role: Role;
  content: string;
};

export interface Task {
  name: string;
  relevantFilesPaths: string[];
  outputFile?: string;
  outputFilePath?: string;
  existingOutputFilePath?: string;
}

export type LLMProvider = 'openai' | 'claude';

export interface Config {
  // General settings
  name: string;
  description: string;
  meniaiDirectory: string;
  saveConfig: boolean;
  llm: LLMProvider;
  model: string;
  configPath: string;

  // File and directory settings
  inputDir: string;
  excludeFiles: string[];
  includeFiles: string[];
  outputDir: string;
  outputFileName: string;
  outputFileExt: string;
  examplesDir: string;
  numExamples: number;
  contextDir: string;
  contextFiles: string[];
  contextFilesLimit: number;

  // Task processing settings
  mode: Mode;
  divideTaskBy: TaskDivideBy;
  recursive: boolean;
  includeSubfolderContents: boolean;
  askBeforeProceeding: boolean;
  limit: number;
  filterTasks: string[];
  iterations: number;

  // Interaction and feedback settings
  interactive: boolean;
  feedbackMaxLength: number;
  feedbackMaxIterations: number;

  // System message settings
  summarizeFeedback?: boolean;
  systemMessageAppendixMaxLength?: number;

  // LLM response handling
  fileContentStartBoundary: string;
  fileContentEndBoundary: string;

  // Debug and logging
  debug: boolean;

  // External services and integrations
  publishPr: boolean;

  // Plugins
  plugins: Plugin[];
  enablePlugins: string[];
}

export interface Context {
  config: Config;
  tasks: Record<string, Task>;
  messages: MessageEntry[];
  systemMessage: SystemMessage;
}
