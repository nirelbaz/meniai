import { resolve } from 'path';
import { Config } from '../types.js';
import { promptUser, printSystemMessage, blankLine } from '../cli/chat.js';
import { readDirectoryFiles, readFile, writeFile } from '../utils/file-system.js';
import { initBotConfig } from '../cli/wizard.js';
import { generateSystemMessage } from '../system-message/system-message.js';
import { search } from '@inquirer/prompts';
import chalk from 'chalk';
import debugProvider from 'debug';

const debug = debugProvider('MeniAI:BotConfig');

export const ensureBotName = async (config: Pick<Config, 'meniaiDirectory' | 'name'>): Promise<string> => {
  if (config.name) {
    return config.name;
  }

  const bots = await getBotList(config);
  let botName: string | undefined;
  if (bots.length > 0) {
    botName = await botSearch(bots);
    blankLine();
  }

  if (!botName) {
    botName = await promptUser("Let's get started! What should we call this MeniAI?");
  }

  return botName;
};

const getBotList = async (config: Pick<Config, 'meniaiDirectory'>): Promise<{ name: string; description: string }[]> => {
  let botConfigFiles: string[] = [];
  try {
    const bots = await readDirectoryFiles(config.meniaiDirectory, true, 'force');
    botConfigFiles = bots?.filter((bot) => bot.endsWith('config.json')) || [];
  } catch (error) {
    debug('Error reading bot directory:', error);
    return [];
  }

  return Promise.all(
    botConfigFiles.map(async (bot) => {
      const botConfigFileContent = await readFile(bot, false, false);
      const { name, description } = JSON.parse(botConfigFileContent || '{}');
      return { name, description };
    })
  );
};

const botSearch = async (bots: { name: string; description: string }[]): Promise<string | undefined> => {
  await printSystemMessage('Which MeniAI would you like to use today?');
  return search({
    message: '',
    source: (term: string | undefined) => {
      const options = bots
        .map((bot) => ({ value: bot.name, name: bot.name, description: bot.description }))
        .filter((bot) => bot.name.toLowerCase().includes(term?.toLowerCase() || ''));

      if (!options.length) {
        return [{ value: term, name: term, description: 'Create a new bot with this name' }];
      }

      return options;
    },
    theme: {
      prefix: chalk.blueBright.bold(`User:`),
      style: {
        message: () => '',
        answer: (text: string) => chalk.blueBright(text),
        highlight: (text: string) => chalk.green(text),
        description: (text: string) => `${chalk.white('Description:')} ${chalk.gray(text)}`,
        searchTerm: (text: string) =>
          text ? chalk.white(text) : chalk.dim('(Select an existing bot or create a new one by typing the name) ')
      }
    }
  });
};

export const loadBotConfig = async (
  config: Pick<Config, 'name' | 'meniaiDirectory' | 'llm'> & Partial<Config>
): Promise<Partial<Config>> => {
  const botConfigFilePath = getBotConfigFilePath(config);
  const botConfigFileContent = await readFile(`${botConfigFilePath}/config.json`, false, false);
  const botConfig = botConfigFileContent ? JSON.parse(botConfigFileContent) : null;

  if (botConfig) {
    return botConfig;
  }

  const { newConfig, newSystemMessage } = await handleNewBotInitialization(config);

  await printSystemMessage('Thank you for setting up your MeniAI bot!');

  if (newConfig.saveConfig === true || config.saveConfig) {
    await saveBotConfig(botConfigFilePath, newConfig);
    await saveBotSystemMessage(botConfigFilePath, newSystemMessage);
    await printSystemMessage(`Configuration saved to ${botConfigFilePath}. Check the files for more details and to make any adjustments.`);
  }

  return newConfig;
};

const getBotConfigFilePath = (config: Pick<Config, 'name' | 'meniaiDirectory'>): string => {
  const kebabCaseName = config.name.toLowerCase().replace(/\s+/g, '-');
  return resolve(process.cwd(), `${config.meniaiDirectory}/${kebabCaseName}`);
};

const handleNewBotInitialization = async (
  config: Pick<Config, 'llm' | 'name'> & Partial<Config>
): Promise<{ newConfig: Partial<Config>; newSystemMessage: string }> => {
  const newConfig = await initBotConfig(config);
  const newSystemMessage = await generateSystemMessage(config.llm, config.name, newConfig.description);

  return { newConfig, newSystemMessage };
};

export const saveBotConfig = async (botFolderPath: string, newConfig: Partial<Config>): Promise<void> => {
  await writeFile(`${botFolderPath}/config.json`, JSON.stringify(newConfig, null, 2), 'force');
};

export const saveBotSystemMessage = async (botFolderPath: string, systemMessage: string): Promise<void> => {
  await writeFile(`${botFolderPath}/system-message.txt`, systemMessage, 'force');
};
