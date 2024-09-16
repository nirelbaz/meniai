import { input, confirm, select, number, checkbox } from '@inquirer/prompts';
import { blankLine, printSystemMessage } from './chat.js';
import { Config } from '../types.js';
import { defaults } from '../config/defaults.js';
import { Plugin } from '../plugins/plugin-manager.js';

async function getBasicConfig(name: string) {
  const description = await input({
    message: `Describe ${name}'s role and capabilities:`,
    default: 'A programmer ninja that refactors code'
  });
  const interactive = await confirm({
    message: 'Would you like to enable interactive mode (ask for feedback)?',
    default: defaults.interactive
  });
  const inputDir = await input({ message: `Where should ${name} look for input files?`, default: defaults.inputDir });

  return { description, interactive, inputDir };
}

async function getTaskDivisionConfig() {
  const divideTaskBy = (await select({
    message: `How should tasks be divided?`,
    choices: [
      { value: 'file', name: 'File', description: 'Will create a separate task for each file' },
      {
        value: 'name',
        name: 'Name',
        description:
          'Will create a separate task for each file name prefix, using the part before the first dot (e.g., for "file.name.ts" and "file.name2.ts" will be a single task called "file")'
      },
      {
        value: 'folder',
        name: 'Folder',
        description: 'Will group all files in the same folder into a single task'
      }
    ],
    default: defaults.divideTaskBy
  })) as Config['divideTaskBy'];
  const recursive = await confirm({ message: `Should files be processed recursively?`, default: defaults.recursive });

  let includeSubfolderContents = false;
  if (!recursive && divideTaskBy === 'folder') {
    includeSubfolderContents = await confirm({
      message: `Should nested files in the task folder be included?`,
      default: defaults.includeSubfolderContents
    });
  }

  return { divideTaskBy, recursive, includeSubfolderContents };
}

async function getFileConfig() {
  const includeFiles = await input({
    message: 'Which files should be included (glob patterns, comma-separated)?',
    default: defaults.includeFiles?.join(',')
  });
  const excludeFiles = await input({
    message: 'Which files should be excluded (glob patterns, comma-separated)?',
    default: defaults.excludeFiles?.join(',')
  });

  return {
    includeFiles: includeFiles.split(',').map((file) => file.trim()),
    excludeFiles: excludeFiles.split(',').map((file) => file.trim())
  };
}

async function getOutputConfig(inputDir: string) {
  const mode = await select({
    message: `Which operation mode should be used for processing tasks?`,
    choices: [
      { value: 'refactor', name: 'Refactor', description: "Refactor the task's file" },
      { value: 'generate', name: 'Generate', description: 'Generate a new file for the task' }
    ],
    default: 'refactor'
  });

  if (mode === 'refactor') {
    return { outputDir: inputDir };
  }

  const outputDir = await input({ message: `Where should output files be saved?`, default: inputDir });
  const outputFileExt = await input({ message: `What extension should be used for output files?`, default: defaults.outputFileExt });
  const outputFileName = await input({
    message: `What should the output file be named (leave empty to use the task name)?`,
    default: defaults.outputFileName
  });

  return { outputDir, outputFileExt, outputFileName };
}

async function getExampleConfig(outputDir: string) {
  const addExample = await confirm({
    message: `Would you like to add example files? Example files can help guide the AI in understanding the desired output format and style.`,
    default: false
  });
  if (!addExample) {
    return { examplesDir: defaults.examplesDir, numExamples: defaults.numExamples };
  }

  const examplesDir = await input({ message: 'Please specify the directory containing example files:', default: outputDir });
  const numExamples = await number({
    message: `How many maximum example files should be used?`,
    default: 4,
    validate: (input) => !isNaN(Number(input)) || 'Please enter a valid number.'
  });

  return { examplesDir, numExamples };
}

async function getContextConfig(outputDir: string) {
  const addContext = await confirm({
    message: `Would you like to add context files? Context files provide additional information to the AI assistant, helping it better understand your project's structure and requirements.`,
    default: false
  });
  if (!addContext) {
    return {};
  }

  const contextDir = await input({ message: 'Please specify the directory containing context files:', default: outputDir });
  const contextFiles = await input({
    message: 'Which files should be used as context (glob patterns, comma-separated)?',
    default: defaults.contextFiles?.join(',')
  });
  const contextFilesLimit = await number({
    message: `How many context files should be attached to the system message?`,
    default: defaults.contextFilesLimit,
    validate: (input) => !isNaN(Number(input)) || 'Please enter a valid number.'
  });

  return { contextDir, contextFiles: contextFiles.split(',').map((file) => file.trim()), contextFilesLimit };
}

async function getPluginsConfig(plugins: Plugin[]) {
  if (plugins.length === 0) {
    return {};
  }

  const pluginNames = plugins.map((plugin) => plugin.name);
  const enablePlugins = await checkbox({
    message: 'Which plugins should be enabled?',
    choices: pluginNames.map((name) => ({ value: name, name: name }))
  });

  return { enablePlugins };
}

export async function initBotConfig(config: Partial<Config>) {
  await printSystemMessage('Welcome to the MeniAI Bot Setup Wizard!');

  const basicConfig = await getBasicConfig(config.name!);
  const taskDivisionConfig = await getTaskDivisionConfig();
  const fileConfig = await getFileConfig();
  const outputConfig = await getOutputConfig(basicConfig.inputDir as string);
  const exampleConfig = await getExampleConfig(outputConfig.outputDir as string);
  const contextConfig = await getContextConfig(outputConfig.outputDir as string);
  const pluginsConfig = await getPluginsConfig(config.plugins || []);

  let saveConfig = true;
  if (!config.saveConfig) {
    saveConfig = await confirm({ message: 'Would you like to save the configuration?', default: saveConfig });
  }

  blankLine();

  const newConfig = {
    name: config.name,
    ...basicConfig,
    ...taskDivisionConfig,
    ...fileConfig,
    ...outputConfig,
    ...exampleConfig,
    ...contextConfig,
    ...pluginsConfig,
    saveConfig
  };

  return newConfig;
}
