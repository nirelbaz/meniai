![MeniAI Cover](assets/cover.jpg)

[![npm version](https://img.shields.io/npm/v/meniai.svg)](https://www.npmjs.com/package/meniai)
[![license](https://img.shields.io/npm/l/meniai.svg)](https://github.com/nirelbaz/meniai/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/nirelbaz/meniai.svg)](https://github.com/nirelbaz/meniai/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/nirelbaz/meniai.svg)](https://github.com/nirelbaz/meniai/pulls)
[![GitHub last commit](https://img.shields.io/github/last-commit/nirelbaz/meniai.svg)](https://github.com/nirelbaz/meniai/commits/main)

# MeniAI

**MeniAI** is a revolutionary command-line tool that redefines how developers integrate AI into their workflows. Create task-specific AI bots that live alongside your project, evolving and adapting based on user feedback. These bots streamline routine development tasks and can be used locally on demand or fully automated within your CI/CD pipeline.

## Table of Contents

- [Why MeniAI?](#why-meniai)
- [Key Features](#key-features)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Command Options Documentation](#command-options-documentation)
- [GitHub Integration](#github-integration)
- [Plugin System](#plugin-system)
- [Recommended Use Case](#recommended-use-case)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)
- [Acknowledgements](#acknowledgements)

## Why MeniAI?

Unlike other AI-powered development tools, MeniAI emphasizes the creation of **project-specific bots** that:

- **Live within your repository**: Bots evolve alongside your project, adapting to the specific needs of your codebase.
- **Learn from feedback**: In **interactive mode**, bots receive feedback and improve by incorporating your suggestions.
- **Flexible operation**: Bots can assist you interactively for development tasks or be automated to run independently when ready (e.g., via GitHub Actions).

This flexibility allows developers to streamline their workflows while ensuring bots are tailored to their project's unique needs.

## Key Features

- **Task-Specific Bots**: Create customizable AI-powered bots that adapt to your project's evolving needs.
- **Interactive Learning Mode**: Bots learn from user feedback during usage, improving over time.
- **Optional Automation**: Bots can be integrated into CI/CD pipelines or used on demand as developer tools.
- **GitHub Integration**: Automate pull requests with AI-generated changes.
- **Seamless File Handling**: Process multiple files, directories, and tasks with recursive options.
- **Custom Plugins**: Extend MeniAI with custom plugins for project-specific automation tasks.
- **Multi-LLM Support**: Choose between OpenAI's GPT models and Anthropic's Claude for your AI tasks.

## Installation

### Global Installation

```bash
npm install -g meniai
```

### Install as a Project Dependency

```bash
npm install --save-dev meniai
```

## Getting Started

1. **Set up your API key**:  
   Add your OpenAI or Anthropic API key to a `.env` file:

   ```bash
   OPENAI_API_KEY=your_openai_api_key
   # or
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

2. **Create a task-specific bot**:  
   Run the following command to start the setup wizard and create a new bot:

   ```bash
   meniai
   ```

   Follow the setup wizard to configure your first bot.

3. **Use your bot in interactive mode**:  
   Run your bot interactively to refine its output, where you'll be prompted to review and adjust each task:

   ```bash
   meniai --name YourBotName [options]
   ```

4. **Use your bot in non-interactive mode (e.g., in CI/CD pipeline)**:  
   To run the bot without any prompts, you can use the `--no-interactive` flag. For instance, in a CI/CD pipeline, you might also want to publish a pull request after the bot processes the tasks:

   ```bash
   meniai --name YourBotName --no-interactive --publish-pr [options]
   ```

   This will run the bot automatically, process all tasks, and create a pull request with the changes. It's ideal for running MeniAI in environments where user input is not available, such as automated CI/CD pipelines.

## Configuration

MeniAI uses two levels of configuration:

1. **Project-wide configuration**: Set default behaviors for your project using a `meniai.config.js` file in your project root:

   ```javascript
   import prettierPlugin from './plugins/prettier-plugin.js';
   import lintPlugin from './plugins/lint-plugin.js';
   import tscPlugin from './plugins/tsc-plugin.js';

   export default {
     plugins: [prettierPlugin, lintPlugin, tscPlugin],
     llm: 'claude',
     model: 'claude-3-5-sonnet-20240620'
   };
   ```

2. **Bot-specific configuration**: Each bot has its own configuration stored in the `.meniai` directory:

   - `.meniai/bot-name/config.json`: Contains bot-specific settings.
   - `.meniai/bot-name/system-message.txt`: Stores the bot's system message.

   These files are automatically created and updated when you create or modify a bot.

Bot-specific configurations can be overridden via command-line options when running a bot.

For all available options, run:

```bash
meniai --help
```

## Command Options Documentation

MeniAI provides a variety of command-line options to control bot behavior, file processing, interaction, and feedback. These options can also be set in the **main configuration file** (`meniai.config.js`) or a **bot-specific configuration file** using camelCase.

The configuration settings are applied in the following order, with each layer overriding the previous one:

1. **MeniAI default settings**
2. **Main config file** (`meniai.config.js`)
3. **Bot-specific config file** (`.meniai/bot-name/config.json`)
4. **Command-line options**

This allows for flexible, layered configurations, ensuring that you can define global settings, bot-specific overrides, and one-off command-line adjustments.

### General Settings

- `-n, --name <name>`: Name of the bot.
- `--llm <name>`: Specify the LLM (Large Language Model) to use for bot operations.
- `--model <model>`: Specify the LLM model to use for bot operations.
- `--meniai-directory <path>`: Path to the MeniAI configuration directory.
- `-s, --save-config`: Save the current configuration for future use.
- `--config-path <path>`: Path to the custom configuration file.

### File and Directory Settings

- `-i, --input-dir <path>`: Path to the input directory.
- `--exclude-files <types>`: Comma-separated list of file types to exclude (e.g., `.test.js`).
- `--include-files <types>`: Comma-separated list of file types to include (e.g., `.js,.ts`).
- `-O, --output-dir <path>`: Path to the output directory.
- `--output-file-name <name>`: Specify the name of the output file (without extension).
- `--output-file-ext <extension>`: File extension for output files (e.g., `.js`).
- `-e, --examples-dir <path>`: Path to the examples directory.
- `--num-examples <number>`: Number of example files to attach to the system message.
- `--context-dir <path>`: Path to the context directory.
- `--context-files <files>`: Comma-separated list of context files to attach to the system message.
- `--context-files-limit <number>`: Limit the number of context files to attach to the system message.

### Task Processing Settings

- `-m, --mode <mode>`: Operation mode (`both`, `update`, `generate`).
- `--divide-task-by <type>`: Specify how to divide tasks (`file`, `folder`, `name`).
- `--recursive`: Include subfolders and process each file/folder as a separate task.
- `--no-recursive`: Do not include subfolders for processing.
- `--include-subfolder-contents`: When dividing tasks by folder, include contents of subfolders in the parent folder's task.
- `--ask-before-proceeding`: Ask before proceeding to the next file.
- `--no-ask-before-proceeding`: Do not ask before proceeding to the next file.
- `--limit <number>`: Set a maximum number of tasks to process in this run.
- `-f, --filter-tasks <tasks>`: Process only tasks whose names match the given comma-separated list.
- `--iterations <number>`: Set the number of iterations to run on the set of tasks.

### Interaction and Feedback Settings

- `--interactive`: Enable interactive mode (default).
- `--no-interactive`: Disable interactive mode for fully automatic processing.
- `--feedback-max-length <number>`: Maximum length of the feedback command output.
- `--feedback-max-iterations <number>`: Maximum number of feedback iterations to run.
- `--summarize-feedback`: Summarize user feedback and add it to the system message.
- `--no-summarize-feedback`: Do not summarize user feedback and add it to the system message.

### LLM Response Handling

- `--file-content-start-boundary <marker>`: Marker indicating the start of file content.
- `--file-content-end-boundary <marker>`: Marker indicating the end of file content.

### Debug and Logging

- `--debug`: Enable debug mode for detailed logging of operations.

### External Services and Integrations

- `--publish-pr`: Automatically create and publish a pull request after processing.
- `--no-publish-pr`: Do not create and publish a pull request after processing.

### Plugins

- `--enable-plugins <plugins>`: Comma-separated list of plugin names to activate (e.g., `Plugin1,Plugin2`).

## GitHub Integration

To enable GitHub pull requests:

1. Set environment variables:

   ```
   GITHUB_TOKEN=your_github_token
   GITHUB_OWNER=your_github_username
   GITHUB_REPO=your_repository_name
   ```

2. Use the `--publish-pr` option:
   ```bash
   meniai --name AutoRefactorBot --publish-pr
   ```

This will create a pull request with AI-generated commit messages and descriptions.

## Plugin System

MeniAI comes with a powerful **plugin system** that allows you to extend its functionality by hooking into various stages of the bot's workflow. Plugins are especially useful when you want to integrate custom tools, perform additional processing, or provide feedback to improve the bot's performance.

### Supported Hooks

MeniAI plugins can tap into the following hooks, allowing you to run custom logic at different stages of a task's lifecycle:

- **preProcess**: Run code before processing any tasks.
- **postProcess**: Run code after all tasks are processed.
- **beforeTaskProcess**: Run code before an individual task is processed.
- **afterTaskProcess**: Run code after an individual task is processed.
- **beforeIteration**: Run code before the iteration over all tasks.
- **afterIteration**: Run code after the iteration over all tasks.
- **beforeFeedbackLoop**: Run code before entering a feedback loop (for interactive refinement).
- **afterFeedbackLoop**: Run code after a feedback loop.
- **beforeUserFeedback**: Run code before requesting user feedback.
- **afterUserFeedback**: Run code after receiving user feedback.
- **autoFeedback**: This special hook allows the plugin to automatically provide feedback to the LLM after each response, both in interactive and automated modes.

The **autoFeedback** hook is particularly useful when running MeniAI in an automated environment, as it can help guide the bot to refine its outputs. You can control how many iterations the bot should handle feedback with the `--feedback-max-iterations` option.

### Example Plugin: ESLint Integration

Here's an example of a plugin that integrates **ESLint** to automatically lint files during task processing. This plugin uses the `autoFeedback` hook to run ESLint on output files and provide feedback to the LLM:

```js
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
```

In this example:

- The **autoFeedback** hook runs after each response from the LLM, using ESLint to lint the output file.
- If any linting errors are detected, they are passed as feedback to the LLM, helping it learn how to avoid those issues in future iterations.
- The plugin makes use of `execPromise` to run the ESLint command and fix any linting issues automatically.

### Configuring Plugins

To use a plugin like the ESLint example, you need to configure it in the **main configuration file** (`meniai.config.js`):

```js
import lintExamplePlugin from './plugins/lint-example-plugin.js';

export default {
  plugins: [lintExamplePlugin],
  llm: 'claude',
  model: 'claude-3-5-sonnet-20240620'
};
```

You can also configure specific plugins for each bot in the bot's configuration file by using the `enablePlugins` field:

```json
{
  "enablePlugins": ["LintExamplePlugin"]
}
```

### Running the Bot with Plugins

To run the bot with the ESLint plugin enabled, you can either specify the plugin in the bot's configuration file or pass the `--enable-plugins` flag when running the bot:

```bash
meniai --name YourBotName --enable-plugins LintExamplePlugin
```

This will trigger the ESLint plugin to run automatically as part of the bot's task processing workflow, ensuring that files are linted and feedback is provided based on the linting results.

## Recommended Use Case

MeniAI is ideal for quickly creating task-specific bots that automate repetitive tasks like documentation, unit tests, code analysis, or refactoring. You start by creating a bot through an easy-to-use wizard, work with it interactively on its first tasks to refine its outcomes, and then automate it within your CI/CD pipeline.

### Example: Automating Storybook Files

1. **Quick Bot Setup**:  
   Run MeniAI without any options to launch the wizard and create a bot to generate Storybook files for your design system components.

   ```bash
   meniai
   ```

2. **Interactive Refinement**:  
   By default, MeniAI operates in interactive mode. Work with the bot on its first tasks, refining the Storybook files it generates, adjusting the structure and content as needed.

3. **Automate the Bot**:  
   Once the bot is refined and its outcomes meet your expectations, you can automate it to run as part of your CI/CD process. The bot can then generate or update files and automatically open pull requests with the changes.

   ```bash
   meniai --name StorybookBot --no-interactive --publish-pr
   ```

4. **Keep Storybook Up to Date Using GitHub Actions**:  
   To ensure your Storybook files are always up to date with the latest changes in your design system, you can integrate MeniAI into your GitHub Actions workflow. Every time you push changes to your design system (e.g., adding or updating components), MeniAI can automatically generate or update Storybook files and open a pull request with the changes.

   Here's an example of how to set this up in your `.github/workflows/ci.yml`:

   ```yaml
   name: Update Storybook Files

   on:
     push:
       paths:
         - 'src/components/**' # Trigger on changes to design system components

   jobs:
     update-storybook:
       runs-on: ubuntu-latest

       steps:
         - name: Checkout code
           uses: actions/checkout@v3

         - name: Set up Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '20'

         - name: Install dependencies
           run: npm install

         - name: Run MeniAI to update Storybook
           run: |
             npm run meniai --name StorybookBot --no-interactive --publish-pr
   ```

This workflow will automatically trigger whenever changes are pushed to the design system components, allowing MeniAI to regenerate Storybook files, and open a pull request for review. This ensures your Storybook stays current without manual updates, streamlining the process of keeping your documentation in sync with the design system.

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## License

MeniAI is open-source and licensed under the MIT License. See the [LICENSE](LICENSE) file for more information.

## Support

For issues or questions, please open an issue on our [GitHub issue tracker](https://github.com/nirelbaz/meniai/issues).

## Acknowledgements

MeniAI is powered by advanced AI models from OpenAI and Anthropic, along with numerous open-source tools that helped shape this project.

---

Happy coding with MeniAI! 🚀
