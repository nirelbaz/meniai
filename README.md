![MeniAI Cover](assets/cover.jpg)

[![npm version](https://img.shields.io/npm/v/meniai.svg)](https://www.npmjs.com/package/meniai)
[![license](https://img.shields.io/npm/l/meniai.svg)](https://github.com/nirelbaz/meniai/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/nirelbaz/meniai.svg)](https://github.com/nirelbaz/meniai/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/nirelbaz/meniai.svg)](https://github.com/nirelbaz/meniai/pulls)
[![GitHub last commit](https://img.shields.io/github/last-commit/nirelbaz/meniai.svg)](https://github.com/nirelbaz/meniai/commits/main)

# MeniAI

**MeniAI** is an innovative command-line tool designed to enhance developer workflows through AI integration. It enables the creation of task-specific AI agents that coexist with your project, learning and adapting based on user feedback. These agents are crafted to streamline routine development tasks and can be utilized both locally on-demand and as part of automated CI/CD pipelines.

![MeniAI Demo](https://storage.googleapis.com/meniaipublic/meniai2.gif)

## Table of Contents

- [Why MeniAI?](#why-meniai)
- [Key Features](#key-features)
- [Installation](#installation)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Command Options](#command-options)
- [GitHub Integration](#github-integration)
- [Plugin System](#plugin-system)
- [Use Cases](#use-cases)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)
- [Acknowledgements](#acknowledgements)

## Why MeniAI?

MeniAI stands out from other AI-powered development tools by focusing on the creation of **project-specific AI agents** that:

- **Live within your repository**: Agents evolve alongside your project, adapting to the specific needs of your codebase.
- **Learn from feedback**: In **interactive mode**, agents receive feedback and improve by incorporating your suggestions.
- **Offer flexible operation**: Agents can assist you interactively for development tasks or be automated to run independently when ready (e.g., via GitHub Actions).

This approach allows developers to streamline their workflows while ensuring agents are tailored to their project's unique requirements.

## Key Features

- **Task-Specific Agents**: Create customizable AI-powered agents that adapt to your project's evolving needs.
- **Interactive Learning Mode**: Agents learn from user feedback during usage, improving over time.
- **Optional Automation**: Integrate agents into CI/CD pipelines or use them on demand as developer tools.
- **GitHub Integration**: Automate pull requests with AI-generated changes.
- **Seamless File Handling**: Process multiple files, directories, and tasks with recursive options.
- **Custom Plugins**: Extend MeniAI with custom plugins for project-specific automation tasks.
- **Multi-LLM Support**: Choose between OpenAI's GPT models and Anthropic's Claude for your AI tasks.

## Installation

### Global Installation

```bash
npm install -g meniai
```

### Project-Specific Installation

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

2. **Create a task-specific agent**:
   Run the following command to start the setup wizard:

   ```bash
   meniai
   ```

   Follow the prompts to configure your first agent. The wizard will help you specify whether the agent should be interactive by default.

3. **Use your agent in interactive mode**:
   Run your agent interactively to refine its output:

   ```bash
   meniai --name YourAgentName [options]
   ```

4. **Use your agent in non-interactive mode**:
   For CI/CD pipelines or automated tasks:

   ```bash
   meniai --name YourAgentName --no-interactive --publish-pr [options]
   ```

   This runs the agent automatically, processes all tasks, and can create a pull request with the changes.

## Configuration

MeniAI uses a two-tier configuration system:

1. **Project-wide configuration**: Set default behaviors in `meniai.config.js` in your project root:

   ```javascript
   import prettierPlugin from './plugins/prettier-plugin.js';
   import lintPlugin from './plugins/lint-plugin.js';
   import tscPlugin from './plugins/tsc-plugin.js';

   export default {
     plugins: [prettierPlugin, lintPlugin, tscPlugin],
     llm: 'claude',
     model: 'claude-3-5-sonnet-latest'
   };
   ```

2. **Agent-specific configuration**: Each agent has its own settings in the `.meniai` directory:

   - `.meniai/agent-name/config.json`: Agent-specific settings
   - `.meniai/agent-name/system-message.txt`: Agent's system message

   These files are automatically managed when you create or modify an agent.

Agent-specific configurations can be overridden via command-line options.

For a full list of options, run:

```bash
meniai --help
```

## Command Options

MeniAI provides a variety of command-line options to control agent behavior, file processing, interaction, and feedback. These options can also be set in the **main configuration file** (`meniai.config.js`) or an **agent-specific configuration file** using camelCase.

The configuration settings are applied in the following order, with each layer overriding the previous one:

1. **MeniAI default settings**
2. **Main config file** (`meniai.config.js`)
3. **Agent-specific config file** (`.meniai/agent-name/config.json`)
4. **Command-line options**

This allows for flexible, layered configurations, ensuring that you can define global settings, agent-specific overrides, and one-off command-line adjustments.

### General Settings

- `-n, --name <name>`: Name of the agent
- `--llm <name>`: Specify the LLM (Large Language Model) to use for agent operations
- `--model <model>`: Specify the LLM model to use for agent operations
- `--meniai-directory <path>`: Path to the MeniAI configuration directory
- `-s, --save-config`: Save the current configuration for future use
- `--config-path <path>`: Path to the custom configuration file

### File and Directory Settings

- `-i, --input-dir <path>`: Path to the input directory
- `--exclude-files <types>`: Comma-separated list of file types to exclude
- `--include-files <types>`: Comma-separated list of file types to include
- `-O, --output-dir <path>`: Path to the output directory
- `--output-file-name <name>`: Specify the name of the output file (without extension)
- `--output-file-ext <extension>`: File extension for output files
- `-e, --examples-dir <path>`: Path to the examples directory
- `--num-examples <number>`: Number of example files to attach to the system message
- `--context-dir <path>`: Path to the context directory
- `--context-files <files>`: Comma-separated list of context files to attach to the system message
- `--context-files-limit <number>`: Limit the number of context files to attach to the system message

### Task Processing Settings

- `-m, --mode <mode>`: Operation mode (`both`, `update`, `generate`)
- `--divide-task-by <type>`: Specify how to divide tasks (`file`, `folder`, `name`)
- `--recursive`: Include subfolders and process each file/folder as a separate task
- `--no-recursive`: Do not include subfolders for processing
- `--include-subfolder-contents`: When dividing tasks by folder, include contents of subfolders in the parent folder's task
- `--ask-before-proceeding`: Ask before proceeding to the next file
- `--no-ask-before-proceeding`: Do not ask before proceeding to the next file
- `--limit <number>`: Set a maximum number of tasks to process in this run
- `-f, --filter-tasks <tasks>`: Process only tasks whose names match the given comma-separated list
- `--iterations <number>`: Set the number of iterations to run on the set of tasks

### Interaction and Feedback Settings

- `--interactive`: Enable interactive mode
- `--no-interactive`: Disable interactive mode for fully automatic processing
- `--feedback-max-length <number>`: Maximum length of the feedback command output
- `--feedback-max-iterations <number>`: Maximum number of feedback iterations to run
- `--summarize-feedback`: Summarize user feedback and add it to the system message
- `--no-summarize-feedback`: Do not summarize user feedback and add it to the system message

### LLM Response Handling

- `--file-content-start-boundary <marker>`: Marker indicating the start of file content
- `--file-content-end-boundary <marker>`: Marker indicating the end of file content

### Debug and Logging

- `--debug`: Enable debug mode for detailed logging of operations

### External Services and Integrations

- `--publish-pr`: Automatically create and publish a pull request after processing
- `--no-publish-pr`: Do not create and publish a pull request after processing

### Plugins

- `--enable-plugins <plugins>`: Comma-separated list of plugin names to activate

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
   meniai --name CodeRefactorAgent --publish-pr
   ```

This creates a pull request with AI-generated commit messages and descriptions.

## Plugin System

MeniAI's plugin system allows you to extend its functionality by hooking into various stages of the agent's workflow.

### Supported Hooks

- **preProcess**, **postProcess**: Run before/after processing all tasks
- **beforeTaskProcess**, **afterTaskProcess**: Run before/after processing each task
- **beforeIteration**, **afterIteration**: Run before/after each iteration over all tasks
- **beforeFeedbackLoop**, **afterFeedbackLoop**: Run before/after feedback loops
- **beforeUserFeedback**, **afterUserFeedback**: Run before/after user feedback
- **autoFeedback**: Provide automatic feedback to the LLM

### Example: ESLint Plugin

```javascript
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

Configure plugins in `meniai.config.js` or enable them per-agent or via command-line options.

## Use Cases

MeniAI excels at automating repetitive tasks such as:

- Generating and updating documentation
- Creating unit tests
- Performing code analysis and refactoring
- Automating Storybook file creation for design systems

### Example: Automating Storybook Files

1. **Create a Storybook Agent**:

   ```bash
   meniai
   ```

2. **Refine Interactively**:
   Work with the agent to generate and refine Storybook files.

3. **Automate in CI/CD**:

   ```bash
   meniai --name StorybookAgent --no-interactive --publish-pr
   ```

4. **Integrate with GitHub Actions**:
   Create a workflow to automatically update Storybook files when components change:

   ```yaml
   name: Update Storybook Files

   on:
     push:
       paths:
         - 'src/components/**'

   jobs:
     update-storybook:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '20'
         - run: npm install
         - run: npm run meniai --name StorybookAgent --no-interactive --publish-pr
   ```

This setup ensures your Storybook documentation stays in sync with your components automatically.

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
