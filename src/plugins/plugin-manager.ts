import { Context, Task } from '../types.js';
import debugProvider from 'debug';
import * as Chat from '../cli/chat.js';

const debug = debugProvider('MeniAI:PluginManager');

type PluginHook =
  | 'preProcess'
  | 'postProcess'
  | 'beforeTaskProcess'
  | 'afterTaskProcess'
  | 'beforeIteration'
  | 'afterIteration'
  | 'beforeFeedbackLoop'
  | 'afterFeedbackLoop'
  | 'beforeUserFeedback'
  | 'afterUserFeedback'
  | 'autoFeedback';

export interface Plugin {
  name: string;
  hooks: {
    [key in PluginHook]?: (context: Context, chat: typeof Chat, task?: Task) => Promise<void | string>;
  };
}

export class PluginManager {
  private plugins: Plugin[];

  constructor(plugins: Plugin[] = []) {
    this.plugins = plugins;
  }

  async runHook(hookName: PluginHook, context: Context, task?: Task): Promise<string> {
    const hookFeedback: string[] = [];

    for (const plugin of this.plugins) {
      if (context.config.enablePlugins && !context.config.enablePlugins.includes(plugin.name)) {
        continue;
      }

      const hook = plugin?.hooks[hookName];
      if (hook) {
        try {
          const result = await this.runHookWithSigintHandler(hook, context, plugin.name, hookName, task);
          if (typeof result === 'string') {
            hookFeedback.push(result);
          }
        } catch (error) {
          debug(`Error running ${hookName} hook for plugin ${plugin.name}:`, error);
        }
      }
    }

    return hookFeedback.join('\n');
  }

  private async runHookWithSigintHandler(
    hook: (context: Context, chat: typeof Chat, task?: Task) => Promise<void | string>,
    context: Context,
    pluginName: string,
    hookName: PluginHook,
    task?: Task
  ): Promise<void | string> {
    return new Promise((resolve, reject) => {
      const sigintHandler = () => {
        debug(`SIGINT received while running ${hookName} hook for plugin ${pluginName}`);
        Chat.deleteLastLine();
        reject(new Error('Hook execution aborted'));
      };
      process.on('SIGINT', sigintHandler);

      return hook(context, Chat, task)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          process.off('SIGINT', sigintHandler);
        });
    });
  }

  addPlugin(plugin: Plugin): void {
    this.plugins.push(plugin);
    debug(`Added plugin: ${plugin.name}`);
  }

  removePlugin(pluginName: string): void {
    const initialLength = this.plugins.length;
    this.plugins = this.plugins.filter((plugin) => plugin.name !== pluginName);
    if (this.plugins.length < initialLength) {
      debug(`Removed plugin: ${pluginName}`);
    } else {
      debug(`Attempted to remove non-existent plugin: ${pluginName}`);
    }
  }

  getPlugins(): ReadonlyArray<Plugin> {
    return this.plugins;
  }
}
