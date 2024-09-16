import { exec } from 'child_process';
import util from 'util';
import axios from 'axios';
import debugProvider from 'debug';
import { BaseLLM } from './base-llm.js';
import { Context } from 'vm';
import { printSystemMessage } from '../cli/chat.js';

const execPromise = util.promisify(exec);
const debug = debugProvider('MeniAI:GitHub');

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
}

class GitHubError extends Error {
  status: number | undefined;
  data: unknown;

  constructor(
    message: string,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'GitHubError';

    if (axios.isAxiosError(originalError)) {
      this.status = originalError.response?.status;
      this.data = originalError.response?.data;
    }
  }
}

export class GitHubIntegration {
  private config: GitHubConfig;
  private llm: BaseLLM;
  private botName: string;

  constructor(context: Context, llm: BaseLLM) {
    this.llm = llm;
    this.botName = context.config.name;
    this.config = this.validateAndGetConfig();
  }

  async createPullRequest(): Promise<void> {
    try {
      // check for changes
      if (await this.hasChanges()) {
        const branchName = await this.generateBranchName();
        await this.executeGitCommands(branchName);
        await this.verifyBranch(branchName);
        await this.createGitHubPR(branchName);
      } else {
        printSystemMessage(`No changes to commit.`);
      }
    } catch (error) {
      debug('Error creating pull request:', error);
      throw new GitHubError('Failed to create pull request', error);
    }
  }

  private validateAndGetConfig(): GitHubConfig {
    const requiredEnvVars = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'];
    requiredEnvVars.forEach((varName) => {
      if (!process.env[varName]) {
        throw new Error(`${varName} is required`);
      }
    });

    return {
      token: process.env.GITHUB_TOKEN!,
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!
    };
  }

  private async hasChanges(): Promise<boolean> {
    const stdout = await this.executeCommand('git status --porcelain');
    return stdout.trim() !== '';
  }

  private async executeGitCommands(branchName: string): Promise<void> {
    const commitMessage = await this.generateCommitMessage();
    const commands = [`git checkout -b ${branchName}`, 'git add .', `git commit -m "${commitMessage}"`, `git push origin ${branchName}`];

    for (const command of commands) {
      await this.executeCommand(command);
    }
  }

  private async executeCommand(command: string): Promise<string> {
    try {
      const { stdout } = await execPromise(command);
      debug(`Git command executed: ${command}`);
      debug('Output:', stdout);
      return stdout;
    } catch (error) {
      debug(`Error executing git command: ${command}`, error);
      throw new GitHubError(`Failed to execute git command: ${command}`, error);
    }
  }

  private async verifyBranch(branchName: string, retries: number = 3): Promise<void> {
    const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/branches/${branchName}`;
    try {
      await this.sendGitHubRequest(url, 'get');
    } catch (error) {
      if (retries > 0) {
        debug(`Branch does not exist: ${branchName}. Retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.verifyBranch(branchName, retries - 1);
      }
      debug('Branch does not exist:', error);
      throw new GitHubError('Branch does not exist', error);
    }
  }

  private async createGitHubPR(branchName: string): Promise<void> {
    const { owner, repo } = this.config;
    const prTitle = await this.generatePRTitle();
    const prDescription = await this.generatePRDescription();
    const defaultBranch = await this.getDefaultBranch();
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls`;
    const data = {
      owner,
      repo,
      title: `[MeniAI][${this.botName}] ${prTitle}`,
      head: branchName,
      base: defaultBranch,
      body: `${prDescription}\n\nThis pull request contains auto-generated updates by ${this.botName} [MeniAI].`
    };

    try {
      const response = await this.sendGitHubRequest(url, 'post', data);
      debug('Pull request created successfully:', response.data.html_url);
    } catch (error) {
      debug('Error creating GitHub PR:', error instanceof GitHubError ? error.data : error);
      throw new GitHubError('Failed to create GitHub pull request', error);
    }
  }

  private async getDefaultBranch(): Promise<string> {
    const { owner, repo } = this.config;
    const url = `https://api.github.com/repos/${owner}/${repo}`;

    try {
      const response = await this.sendGitHubRequest(url, 'get');
      return response.data.default_branch;
    } catch (error) {
      debug('Error fetching default branch:', error);
      throw new GitHubError('Failed to fetch default branch', error);
    }
  }
  private async sendGitHubRequest(url: string, method: 'get' | 'post', data?: unknown) {
    try {
      return await axios({
        method,
        url,
        data,
        headers: {
          Authorization: `Bearer ${this.config.token}`,
          Accept: 'application/vnd.github+json'
        }
      });
    } catch (error) {
      throw new GitHubError(`Failed to send GitHub request: ${method.toUpperCase()} ${url}`, error);
    }
  }

  private async generateBranchName(): Promise<string> {
    const prompt =
      'Generate a branch name for the pull request. The branch name should be in the following format: "<type>/<scope>/<subject>". Do not include any other text in the response.';
    const branchName = await this.llm.sendMessage([prompt], false, 'Generating branch name');
    const kebabCaseBotName = this.botName.replace(/\s+/g, '-').toLowerCase();
    return `${kebabCaseBotName}/${branchName}/${Date.now()}`;
  }

  private async generateCommitMessage(): Promise<string> {
    const prompt =
      'Generate a commit message for the changes made by MeniAI. The commit message should be in the following format: "<type>(<scope>): <subject>". Do not include any other text in the response.';
    const commitMessage = await this.llm.sendMessage([prompt], false, 'Generating commit message');
    return commitMessage;
  }

  private async generatePRTitle(): Promise<string> {
    const prompt =
      'Generate a title for the pull request. The title should be in the following format: "<title>". Do not include any other text in the response.';
    const prTitle = await this.llm.sendMessage([prompt], false, 'Generating PR title');
    return prTitle;
  }

  private async generatePRDescription(): Promise<string> {
    const prompt =
      'Generate a pretty description for the pull request using markdown. The description should be in the following format: "<description>". Do not include any other text in the response.';
    const prDescription = await this.llm.sendMessage([prompt], false, 'Generating PR description');
    return prDescription;
  }
}
