# Contributing to MeniAI

We're thrilled that you're interested in contributing to MeniAI! This document will guide you through the process of contributing to our project. By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)
- [Pull Request Process](#pull-request-process)
- [Code of Conduct](#code-of-conduct)
- [License](#license)

## Getting Started

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```
   git clone https://github.com/yourusername/meniai.git
   cd meniai
   ```
3. Install dependencies:
   ```
   pnpm install
   ```
4. Create a new branch for your feature or bugfix:
   ```
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

1. Make your changes in the relevant files.
2. Run tests to ensure your changes don't break existing functionality:
   ```
   pnpm test
   ```
3. If you've added new functionality, please add appropriate tests.
4. Ensure your code follows the project's coding style:
   ```
   pnpm lint
   pnpm format
   ```
5. Commit your changes using conventional commits:
   ```
   git commit -am 'feat: Add some feature'
   ```
6. Push to your fork:
   ```
   git push origin feature/your-feature-name
   ```
7. Create a new Pull Request from your fork on GitHub.

## Project Structure

- `src/`: Source code directory
  - `index.ts`: Main entry point of the application
  - `cli/`: Command-line interface functionality
  - `config/`: Configuration-related files
  - `integrations/`: Integration with external services (e.g., LLMs, GitHub)
  - `plugins/`: Plugin system implementation
  - `system-message/`: Handles system messages
  - `tasks/`: Contains task-related functionality
  - `types.ts`: TypeScript type definitions
  - `utils/`: Utility functions and helpers
- `tests/`: Test files
- `prompts/`: LLM prompt templates
- `.github/`: GitHub-specific files (e.g., issue templates, workflows)
- `docs/`: Additional documentation

## Coding Standards

- Use TypeScript for all new code.
- Follow the existing code style in the project (enforced by ESLint and Prettier).
- Use meaningful variable and function names.
- Write clear and concise comments when necessary.
- Use conventional commits for commit messages (e.g., `feat:`, `fix:`, `docs:`, `refactor:`).

## Reporting Bugs

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/nirelbaz/meniai/issues/new?template=bug_report.md).

When reporting a bug, please include:
- A clear and descriptive title
- A detailed description of the issue
- Steps to reproduce the behavior
- Expected behavior
- Any relevant code snippets or error messages

## Suggesting Enhancements

We welcome suggestions for enhancements. Please [open a new issue](https://github.com/nirelbaz/meniai/issues/new?template=feature_request.md) to suggest a new feature.

When suggesting an enhancement, please include:
- A clear and descriptive title
- A detailed description of the proposed feature
- Any potential implementation details
- Why this feature would be useful to the project

## Pull Request Process

1. Ensure any install or build dependencies are removed before the end of the layer when doing a build.
2. Update the README.md with details of changes to the interface, including new environment variables, exposed ports, useful file locations, and container parameters.
3. Increase the version numbers in any examples files and the README.md to the new version that this Pull Request would represent.
4. Ensure all tests pass and there are no linting errors.
5. Your Pull Request will be reviewed by the maintainers, who may request changes or ask questions.
6. Once approved, your Pull Request will be merged by a maintainer.

## Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

## License

By contributing to MeniAI, you agree that your contributions will be licensed under the MIT License that covers the project.

Thank you for contributing to MeniAI! Your efforts help make this project better for everyone.
