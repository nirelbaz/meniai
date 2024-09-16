import path from 'path';
import debugProvider from 'debug';
import { Config } from '../types.js';

const debug = debugProvider('MeniAI:UserConfig');

export async function loadUserConfig(configPath: string = 'meniai.config.js'): Promise<Partial<Config>> {
  const absoluteConfigPath = path.join(process.cwd(), configPath);

  try {
    const { default: config } = await import(absoluteConfigPath);
    debug('User config loaded: %O', config);
    return config as Partial<Config>;
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      debug('No meniai.config.ts file found. Using default configuration.');
    } else {
      debug('Error loading meniai.config.ts: %O', error instanceof Error ? error.message : String(error));
    }
    return {};
  }
}
