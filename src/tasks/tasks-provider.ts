import debugProvider from 'debug';
import path from 'path';
import { readDirectoryFiles, readSubDirectories, readFile, removeExtension } from '../utils/file-system.js';
import type { Task, Config } from '../types.js';
import micromatch from 'micromatch';

const debug = debugProvider('MeniAI:TasksProvider');

export class TasksProvider {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  async getTasks(): Promise<Record<string, Task>> {
    const { inputDir, divideTaskBy, filterTasks, limit } = this.config;
    const resolvedInputDir = path.resolve(process.cwd(), inputDir);

    let tasks = await this.getTasksByMode(resolvedInputDir, divideTaskBy);
    tasks = this.filterAndLimitTasks(tasks, filterTasks, limit);
    await this.setupTaskOutputConfigurations(tasks);

    debug('Found tasks', {
      count: Object.keys(tasks).length,
      tasks,
      totalTasksCount: Object.keys(tasks).length,
      limit,
      inputDir: resolvedInputDir,
      divideTaskBy,
      recursive: this.config.recursive,
      includeFiles: this.config.includeFiles,
      excludeFiles: this.config.excludeFiles
    });

    return tasks;
  }

  private async getTasksByMode(inputDir: string, mode: string): Promise<Record<string, Task>> {
    const { includeFiles, excludeFiles, recursive, includeSubfolderContents } = this.config;
    switch (mode) {
      case 'folder':
        return this.getTaskByFolders(inputDir, includeFiles, excludeFiles, recursive, includeSubfolderContents);
      case 'file':
        return this.getTaskByFiles(inputDir, includeFiles, excludeFiles, recursive);
      case 'name':
        return this.getTaskByNames(inputDir, includeFiles, excludeFiles, recursive);
      default:
        throw new Error(`Invalid task mode: ${mode}`);
    }
  }

  private async getTaskByFolders(
    inputDir: string,
    includeFiles: string[],
    excludeFiles: string[],
    recursive: boolean,
    includeSubfolderContents: boolean
  ): Promise<Record<string, Task>> {
    const tasks: Record<string, Task> = {};
    const filesPaths = (await readSubDirectories(inputDir, recursive && !includeSubfolderContents, false)) || [];

    for (const filePath of filesPaths) {
      const taskFiles = (await readDirectoryFiles(filePath, includeSubfolderContents, false)) || [];
      const relevantFilesPaths = this.filterRelevantFiles(taskFiles, includeFiles, excludeFiles);
      if (relevantFilesPaths.length) {
        const taskName = filePath.replace(`${inputDir}${path.sep}`, '');
        tasks[taskName] = { name: taskName, relevantFilesPaths };
      }
    }

    return tasks;
  }

  private async getTaskByFiles(
    inputDir: string,
    includeFiles: string[],
    excludeFiles: string[],
    recursive: boolean
  ): Promise<Record<string, Task>> {
    const filesPaths = (await readDirectoryFiles(inputDir, recursive, false)) || [];
    const relevantFilesPaths = this.filterRelevantFiles(filesPaths, includeFiles, excludeFiles);

    return relevantFilesPaths.reduce(
      (tasks, filePath) => {
        const taskKey = filePath.replace(`${inputDir}${path.sep}`, '');
        const taskName = removeExtension(taskKey);
        tasks[taskKey] = { name: taskName, relevantFilesPaths: [filePath] };
        return tasks;
      },
      {} as Record<string, Task>
    );
  }

  private async getTaskByNames(
    inputDir: string,
    includeFiles: string[],
    excludeFiles: string[],
    recursive: boolean
  ): Promise<Record<string, Task>> {
    const filesPaths = await readDirectoryFiles(inputDir, recursive, false);
    if (!filesPaths) {
      return {};
    }

    const relevantFilesPaths = this.filterRelevantFiles(filesPaths, includeFiles, excludeFiles);

    return relevantFilesPaths.reduce<Record<string, Task>>((tasks, filePath) => {
      const taskKey = filePath.replace(`${inputDir}${path.sep}`, '');
      const taskName = removeExtension(taskKey);
      if (!tasks[taskKey]) {
        tasks[taskKey] = { name: taskName, relevantFilesPaths: [] };
      }
      tasks[taskKey].relevantFilesPaths.push(filePath);
      return tasks;
    }, {});
  }

  private filterAndLimitTasks(tasks: Record<string, Task>, filterTasks: string[], limit: number): Record<string, Task> {
    return Object.entries(tasks)
      .filter(([key]) => !filterTasks.length || filterTasks.includes(key))
      .slice(0, limit < 0 ? undefined : limit)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  }

  private async setupTaskOutputConfigurations(tasks: Record<string, Task>): Promise<void> {
    const { outputFileName, outputFileExt, outputDir, divideTaskBy } = this.config;
    for (const [taskKey, task] of Object.entries(tasks)) {
      task.outputFile = this.getOutputFileName(task.name, taskKey, outputFileName, outputFileExt, divideTaskBy);
      task.outputFilePath = path.join(outputDir, task.outputFile);
      const existingFile = await readFile(task.outputFilePath, false, false);
      if (existingFile) {
        task.existingOutputFilePath = task.outputFilePath;
      }
    }
  }

  private getOutputFileName(
    taskName: string,
    taskKey: string,
    outputFileName: string | undefined,
    outputFileExt: string | undefined,
    divideTaskBy: string
  ): string {
    let fileName = outputFileName
      ? divideTaskBy === 'folder'
        ? `${taskName}/${outputFileName}`
        : outputFileName
      : outputFileExt
        ? `${taskName}${outputFileExt.startsWith('.') ? '' : '.'}${outputFileExt}`
        : taskKey;

    if (outputFileName && outputFileExt) {
      fileName = `${removeExtension(fileName)}${outputFileExt.startsWith('.') ? '' : '.'}${outputFileExt}`;
    }

    return fileName;
  }

  private filterRelevantFiles(filesPaths: string[], includeFiles: string[], excludeFiles: string[]): string[] {
    return filesPaths.filter((filePath) => {
      const relativePath = path.relative(process.cwd(), filePath);
      const includeMatch = !includeFiles.length || includeFiles.some((include) => micromatch.isMatch(relativePath, include));
      const excludeMatch = includeMatch && includeFiles.length && excludeFiles.some((exclude) => micromatch.isMatch(relativePath, exclude));
      return includeMatch && !excludeMatch;
    });
  }
}
