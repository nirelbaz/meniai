import { commandOptions } from '../cli/command-options.js';
import { Config } from '../types.js';
import { defaults } from './defaults.js';
import { loadUserConfig } from './user-config.js';
import { ensureBotName, loadBotConfig } from './bot-config.js';

export const config: Config = {
  ...defaults,
  ...commandOptions,
  plugins: []
} as Config;

export const initializeConfig = async (): Promise<Config> => {
  await integrateUserConfig();
  await integrateBotConfig();
  validateConfig();
  return config;
};

const integrateUserConfig = async (): Promise<void> => {
  const userConfig = await loadUserConfig(config.configPath);

  // Merge user config with the main config
  Object.assign(config, userConfig);
};

const integrateBotConfig = async (): Promise<void> => {
  config.name = await ensureBotName(config);
  const botConfig = await loadBotConfig(config);

  // Merge bot config with the main config
  Object.assign(config, botConfig, commandOptions);
};

const validateConfig = (): void => {
  if (!config.inputDir) {
    throw new Error('Configuration error: "inputDir" is required. Please specify an input directory in the configuration.');
  }
  if (!config.outputDir) {
    throw new Error('Configuration error: "outputDir" is required. Please specify an output directory in the configuration.');
  }

  // Ensure plugins is always an array
  config.plugins = config.plugins || [];
};
