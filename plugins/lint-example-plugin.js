import util from 'util';
import { exec } from 'child_process';
import debugProvider from 'debug';

const debug = debugProvider('MeniAI:LintExamplePlugin');
const execPromise = util.promisify(exec);

const LINT_COMMAND = 'pnpm exec eslint ./{filePath} --fix';

const lintExamplePlugin = {
  name: 'LintExamplePlugin',
  hooks: {
    autoFeedback: async (context, chat, task = undefined) => {
      const command = LINT_COMMAND.replace('{filePath}', task.outputFilePath);
      const spinner = chat.systemLoading(`Linting...`);
      let response = '';

      try {
        const { stdout, stderr } = await execPromise(command);
        if (stderr) {
          debug('Error linting the file', stderr);
          spinner.fail(`Lint failed with error`);
          response = stderr;
        } else {
          debug(`Linted file: ${task.outputFilePath} using command: ${command}`, stdout);
          spinner.succeed('Linted');
        }
      } catch (error) {
        debug('Error linting the file', error);
        spinner.fail(`Lint failed with error`);
        response = error?.stdout || error?.stderr || error?.message || error?.toString();
      } finally {
        chat.blankLine();
      }

      return response ? `Lint result:\n${response}` : undefined;
    }
  }
};

export default lintExamplePlugin;
