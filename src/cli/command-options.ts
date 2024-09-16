import { program, Option } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Config } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJson = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8'));

program.name('MeniAI').description('CLI to manage MeniAI bots for automating menial tasks in your projects').version(packageJson.version);

const splitValue = (value: string): string[] => value.split(',');

const defineOptions = (): void => {
  program
    // General settings
    .addOption(new Option('-n, --name <name>', 'Name of the bot'))
    .addOption(new Option('--llm <name>', 'LLM to use for bot operations'))
    .addOption(new Option('--model <model>', 'LLM model to use for bot operations'))
    .addOption(new Option('--meniai-directory <path>', 'Path to the MeniAI configuration directory'))
    .addOption(new Option('-s, --save-config', 'Save the current configuration for future use'))
    .addOption(new Option('--config-path <path>', 'Path to the configuration file'))

    // File and directory settings
    .addOption(new Option('-i, --input-dir <path>', 'Path to the input directory'))
    .addOption(new Option('--exclude-files <types>', 'Comma-separated list of file types to exclude').argParser(splitValue))
    .addOption(new Option('--include-files <types>', 'Comma-separated list of file types to include').argParser(splitValue))
    .addOption(new Option('-O, --output-dir <path>', 'Path to the output directory'))
    .addOption(new Option('--output-file-name <name>', 'Specify the name of the output file (without extension)'))
    .addOption(new Option('--output-file-ext <extension>', 'File extension for output files'))
    .addOption(new Option('-e, --examples-dir <path>', 'Path to the examples directory'))
    .addOption(new Option('--num-examples <number>', 'Number of example files to attach to the system message').argParser(Number))
    .addOption(new Option('--context-dir <path>', 'Path to the context directory'))
    .addOption(
      new Option('--context-files <files>', 'Comma-separated list of context files to attach to the system message').argParser(splitValue)
    )
    .addOption(
      new Option('--context-files-limit <number>', 'Limit the number of context files to attach to the system message').argParser(Number)
    )

    // Task processing settings
    .addOption(new Option('-m, --mode <mode>', 'Operation mode').choices(['both', 'update', 'generate']))
    .addOption(
      new Option('--divide-task-by <type>', 'Specify how to divide tasks: by individual file, folder, or custom name').choices([
        'file',
        'folder',
        'name'
      ])
    )
    .addOption(new Option('--recursive', 'Include subfolders and process each file/folder as a separate task'))
    .addOption(new Option('--no-recursive', 'Do not include subfolders and process each file/folder as a separate task'))
    .addOption(
      new Option(
        '--include-subfolder-contents',
        "When dividing tasks by folder, include contents of subfolders in the parent folder's task"
      )
    )
    .addOption(new Option('--ask-before-proceeding', 'Ask before proceeding to the next file'))
    .addOption(new Option('--no-ask-before-proceeding', 'Do not ask before proceeding to the next file'))
    .addOption(new Option('--limit <number>', 'Set a maximum number of tasks to process in this run').argParser(Number))
    .addOption(
      new Option('-f, --filter-tasks <tasks>', 'Process only tasks whose names match the given comma-separated list').argParser(splitValue)
    )
    .addOption(new Option('--iterations <number>', 'Set the number of iterations to run on the set of tasks').argParser(Number))

    // Interaction and feedback settings
    .addOption(new Option('--interactive', 'Enable interactive mode to review and provide feedback on each edit'))
    .addOption(new Option('--no-interactive', 'Disable interactive mode to review and provide feedback on each edit'))
    .addOption(new Option('--feedback-max-length <number>', 'Maximum length of the feedback command output').argParser(Number))
    .addOption(
      new Option('--feedback-max-iterations <number>', 'Maximum number of iterations to run the feedback command').argParser(Number)
    )
    .addOption(new Option('--summarize-feedback', 'Summarize user feedback and add it to the system message'))
    .addOption(new Option('--no-summarize-feedback', 'Do not summarize user feedback and add it to the system message'))

    // LLM response handling
    .addOption(new Option('--file-content-start-boundary <marker>', 'Marker indicating the start of file content'))
    .addOption(new Option('--file-content-end-boundary <marker>', 'Marker indicating the end of file content'))

    // Debug and logging
    .addOption(new Option('--debug', 'Enable debug mode for detailed logging of operations'))

    // External services and integrations
    .addOption(new Option('--publish-pr', 'Automatically create and publish a pull request with the changes after processing'))
    .addOption(new Option('--no-publish-pr', 'Do not automatically create and publish a pull request with the changes after processing'))

    // Plugins
    .addOption(new Option('--enable-plugins <plugins>', 'Comma-separated list of plugin names to activate').argParser(splitValue));
};

defineOptions();
program.parse(process.argv);

const commandOptions = program.opts() as Partial<Config>;
export { commandOptions, program };
