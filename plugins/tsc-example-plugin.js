import util from 'util';
import { exec } from 'child_process';
import debugProvider from 'debug';

const debug = debugProvider('MeniAI:TscExamplePlugin');
const execPromise = util.promisify(exec);

const TSC_COMMAND = 'pnpm exec tsc ./{filePath} --noEmit';

const tscExamplePlugin = {
  name: 'TscExamplePlugin',
  hooks: {
    autoFeedback: async (context, chat, task = undefined) => {
      const command = TSC_COMMAND.replace('{filePath}', task.outputFilePath);
      const spinner = chat.systemLoading(`Compiling...`);
      let response = '';

      try {
        const { stdout, stderr } = await execPromise(command);
        if (stderr) {
          debug('Error compiling the file', stderr);
          spinner.fail(`Compile failed with error`);
          response = stderr;
        } else {
          debug(`Compiled file: ${task.outputFilePath} using command: ${command}`, stdout);
          spinner.succeed('Compiled');
        }
      } catch (error) {
        debug('Error compiling the file', error);
        spinner.fail(`Compile failed with error`);
        response = error?.stdout || error?.stderr || error?.message || error?.toString();
      } finally {
        chat.blankLine();
      }

      return response ? `TypeScript compile result:\n${response}` : undefined;
    }
  }
};
export default tscExamplePlugin;
