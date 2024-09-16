import micromatch from 'micromatch';
import type { Context } from '../types.js';
import { readDirectoryFiles, readFile } from '../utils/file-system.js';
import debugProvider from 'debug';

const debug = debugProvider('MeniAI:ContextFilesProvider');

export class ContextFilesProvider {
  private context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  async getContextFiles() {
    const { contextDir, contextFiles, contextFilesLimit } = this.context.config;
    if (!contextDir) {
      return;
    }

    const allFilesPaths = await readDirectoryFiles(contextDir, true);

    if (!allFilesPaths?.length) {
      debug('No files found in the specified directory');
      return;
    }

    let filteredFilesPaths = this.filterFiles(allFilesPaths, contextFiles);

    if (contextFilesLimit > 0) {
      filteredFilesPaths = filteredFilesPaths.slice(0, contextFilesLimit);
    }

    debug(`Reading ${filteredFilesPaths.length} context files...`);
    const contextFilesContent = await this.readFilesContent(filteredFilesPaths);

    const contextFilesMessage = this.formatContextFilesMessage(
      contextFilesContent,
      this.context.config.fileContentStartBoundary,
      this.context.config.fileContentEndBoundary
    );

    debug(`Appending context files message to the system message of length ${contextFilesMessage.length}...`);
    await this.context.systemMessage.append(contextFilesMessage);
  }

  private filterFiles(allFilesPaths: string[], contextFiles: string[]) {
    if (!contextFiles.length) {
      return allFilesPaths;
    }

    return allFilesPaths.filter((filePath) => contextFiles.some((include) => micromatch.isMatch(filePath, include)));
  }

  private async readFilesContent(paths: string[]): Promise<Record<string, string>> {
    const fileContents: Record<string, string> = {};
    const contents = await Promise.all(paths.map((path) => readFile(path)));

    contents.forEach((content, index) => {
      if (content) {
        fileContents[paths[index]] = content;
      }
    });

    return fileContents;
  }

  private formatContextFilesMessage(contents: Record<string, string>, startMarker: string, endMarker: string): string {
    const formattedContextFiles = Object.entries(contents)
      .map(([path, content]) => `// ${path}\n${startMarker}\n${content}\n${endMarker}`)
      .join('\n\n');

    return `Here are some context files from the project that may be relevant to the task:\n\n${formattedContextFiles}`;
  }
}
