import util from 'util';
import { exec } from 'child_process';
import debugProvider from 'debug';

const debug = debugProvider('MeniAI:PrettierExamplePlugin');
const execPromise = util.promisify(exec);

const FORMAT_COMMAND = 'pnpm exec prettier --write {filePath}';

const prettierExamplePlugin = {
  name: 'PrettierExamplePlugin',
  hooks: {
    beforeUserFeedback: async (context, chat, task = undefined) => {
      const command = FORMAT_COMMAND.replace('{filePath}', task.outputFilePath);
      const spinner = chat.systemLoading(`Formatting...`);
      try {
        const { stdout, stderr } = await execPromise(command);
        if (stderr) {
          debug(`Error formatting the file: ${stderr}`);
          spinner.fail(`Formatting failed with error: ${stderr}`);
        } else {
          debug(`Formatted file: ${task.outputFilePath} using command: ${command}`, stdout);
          spinner.succeed('Formatted');
        }
      } catch (error) {
        debug(`Error formatting the file: ${error}`);
        spinner.fail(`Formatting failed with error: ${error}`);
      } finally {
        chat.blankLine();
      }
    }
  }
};

export default prettierExamplePlugin;
