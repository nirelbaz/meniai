import debugProvider from 'debug';
import { readDirectoryFiles, readFile } from '../utils/file-system.js';
import type { Context } from '../types.js';

const debug = debugProvider('MeniAI:ExamplesProvider');

export class ExamplesProvider {
  private context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  async getExampleMessage(): Promise<void> {
    const { examplesDir, outputDir, recursive, outputFileExt, numExamples, fileContentStartBoundary, fileContentEndBoundary } =
      this.context.config;

    if (numExamples === 0) {
      return;
    }

    try {
      const allFilesPaths = await readDirectoryFiles(examplesDir || outputDir, recursive);

      if (!allFilesPaths?.length) {
        debug('No files found in the specified directory');
        return;
      }

      const filteredFilesPaths = this.filterFilesByExtension(allFilesPaths, outputFileExt);

      if (!filteredFilesPaths.length) {
        debug('No files match the specified extension');
        return;
      }

      const examplesPaths = filteredFilesPaths.slice(0, Number(numExamples));
      const examplesContent = await this.readExampleContents(examplesPaths);

      const examplesMessage = this.formatExamplesMessage(examplesContent, fileContentStartBoundary, fileContentEndBoundary);
      await this.context.systemMessage.append(examplesMessage);

      debug(`Successfully appended ${examplesContent.length} examples to the system message`);
    } catch (error) {
      debug('Error occurred while getting example message:', error);
    }
  }

  private filterFilesByExtension(filePaths: string[], extension?: string): string[] {
    return extension ? filePaths.filter((filePath) => filePath.endsWith(extension)) : filePaths;
  }

  private async readExampleContents(paths: string[]): Promise<string[]> {
    const contents = await Promise.all(paths.map((path) => readFile(path)));
    return contents.filter((content): content is string => content !== undefined);
  }

  private formatExamplesMessage(contents: string[], startMarker: string, endMarker: string): string {
    const formattedExamples = contents.map((content) => `${startMarker}\n${content}\n${endMarker}`).join('\n\n');

    return `Here are some examples you should use as a reference for the structure, format, language and syntax:\n\n${formattedExamples}`;
  }
}
