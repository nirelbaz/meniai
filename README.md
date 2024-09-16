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
- [Usage Examples](#usage-examples)
- [GitHub Integration](#github-integration)
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

   ```
   OPENAI_API_KEY=your_openai_api_key
   # or
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

2. **Create a task-specific bot**:

   ```bash
   meniai
   ```

   Follow the setup wizard to configure your bot. During this process, you can specify whether the bot should operate in interactive mode by default.

3. **Use your bot**:
   ```bash
   meniai --name YourBotName [options]
   ```

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

## Usage Examples

1. **Create a new bot**:

   ```bash
   meniai
   ```

   This will start the interactive setup wizard for creating a new bot.

2. **Run a bot in non-interactive mode**:

   ```bash
   meniai --name CodeRefactorBot --interactive false
   ```

3. **Refactor code in specific directories**:

   ```bash
   meniai --name StyleBot --input-dir ./src --output-dir ./refactored
   ```

4. **Use OpenAI's GPT-4 for a specific task**:
   ```bash
   meniai --name DocBot --llm openai --model gpt-4
   ```

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
