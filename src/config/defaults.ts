import type { Config } from '../types.js';

export const defaults: Partial<Config> = {
  // General settings
  llm: 'claude', // openai | claude
  meniaiDirectory: './.meniai', // directory where the MeniAI configuration files are stored

  // File and directory settings
  inputDir: './', // directory where input files are stored
  outputDir: './', // directory where output files are stored
  outputFileName: '', // name of the output file
  includeFiles: ['**/*.js', '**/*.ts'], // file types to include
  excludeFiles: ['node_modules/**/*', 'dist/**/*'], // file types to exclude
  examplesDir: './', // directory where example files are stored
  numExamples: 0, // number of example files to attach to the system message
  contextFilesLimit: 10, // number of context files to attach to the system message

  // Task processing settings
  mode: 'both', // both | update | generate
  divideTaskBy: 'file', // file | name | folder
  recursive: true, // whether to iterate over all subfolders
  askBeforeProceeding: true, // whether to ask the user before proceeding to the next file
  limit: -1, // limit the number of tasks to process
  filterTasks: [], // filter tasks by name
  iterations: 1, // number of iterations to run the system

  // Interaction and feedback settings
  interactive: true, // will ask for feedback on each edit
  feedbackMaxLength: 20000, // maximum length of the feedback
  feedbackMaxIterations: 8, // maximum number of iterations to ask for feedback

  // System message settings
  summarizeFeedback: true, // whether to summarize user feedback and add it to the system message
  systemMessageAppendixMaxLength: 100000, // maximum length of the system message appendix

  // LLM response handling
  fileContentStartBoundary: '<!--FILE_START-->', // marker indicating the start of file content
  fileContentEndBoundary: '<!--FILE_END-->', // marker indicating the end of file content

  // Debug and logging
  debug: false, // whether to print debug logs

  // GitHub settings
  publishPr: false // whether to publish a PR with the changes
};
