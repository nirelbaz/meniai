import util from 'util';
import { exec } from 'child_process';
import debugProvider from 'debug';

const debug = debugProvider('MeniAI:JestConfigWithTsJest');
const execPromise = util.promisify(exec);

const JEST_COMMAND = 'pnpm exec jest ./{filePath}';

const jestExamplePlugin = {
  name: 'JestExamplePlugin',
  hooks: {
    autoFeedback: async (context, chat, task = undefined) => {
      const command = JEST_COMMAND.replace('{filePath}', task.outputFilePath);
      const spinner = chat.systemLoading(`Testing...`);
      let response = '';

      try {
        const { stdout, stderr } = await execPromise(command);
        if (stderr) {
          debug('Error testing the file', stderr);
          spinner.fail(`Testing failed with error`);
          response = stderr;
        } else {
          debug(`Tested file: ${task.outputFilePath} using command: ${command}`, stdout);
          spinner.succeed('Task completed successfully');
        }
      } catch (error) {
        debug('Error testing the file', error);
        spinner.fail(`Testing failed with error`);
        response = error?.stdout || error?.stderr || error?.message || error?.toString();
      } finally {
        chat.blankLine();
      }

      return response ? `Jest test result:\n${response}` : undefined;
    }
  }
};
export default jestExamplePlugin;
