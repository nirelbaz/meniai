import chalk from 'chalk';
import debugProvider from 'debug';
import { Ora } from 'ora';
import { assistantLoading, blankLine, MessageType } from './chat.js';

const debug = debugProvider('MeniAI:Chat');

export const createAssistantFileStreamHandler = (
  fileContentStartBoundary: string,
  fileContentEndBoundary: string
): { streamChunkContent: (content: string) => void; stopStream: () => void } => {
  let isCodeContent = false;
  let spinner: Ora | null = null;
  let lastContent = '';
  let boundaryBuffer = '';

  process.stdout.write(chalk.greenBright.bold(`${MessageType.Assistant}: `));

  const streamChunkContent = (content: string): void => {
    const contentWithBoundaryBuffer = boundaryBuffer + content;

    if (!isBoundaryPart(contentWithBoundaryBuffer)) {
      boundaryBuffer = ''; // Reset boundary buffer if not a boundary part

      if (contentWithBoundaryBuffer.includes(fileContentStartBoundary) && !isCodeContent) {
        handleStartFileMarker(contentWithBoundaryBuffer);
      } else if (contentWithBoundaryBuffer.includes(fileContentEndBoundary) && isCodeContent) {
        handleEndFileMarker(contentWithBoundaryBuffer);
      } else if (!isCodeContent) {
        handleNonCodeContent(contentWithBoundaryBuffer);
      }
    }
  };

  const isBoundaryPart = (content: string): boolean => {
    const isContentStartWithNewLine = content.startsWith('\n');
    const contentLines = isContentStartWithNewLine ? [content] : content.split('\n');
    const contentFirstLine = contentLines[0].trim();
    const contentLastLine = contentLines[contentLines.length - 1].trim();
    const isBoundaryPart =
      (!!contentLastLine && fileContentStartBoundary.startsWith(contentLastLine)) ||
      (!!contentFirstLine && fileContentEndBoundary.startsWith(contentFirstLine));

    boundaryBuffer = isContentStartWithNewLine ? content : `\n${content}`;

    return isBoundaryPart;
  };

  const handleStartFileMarker = (content: string): void => {
    const trimmedContent = content.split(fileContentStartBoundary)[0].replace(':', '.').trimEnd();
    debug('Handling start file marker', { content, fileContentStartBoundary, trimmedContent });
    process.stdout.write(chalk.white(trimmedContent));
    isCodeContent = true;

    if (!spinner?.isSpinning) {
      blankLine();
      if (!lastContent.includes('\n')) {
        blankLine();
      }
      spinner = assistantLoading('Please wait while I process the file...');
    }

    lastContent = trimmedContent;
  };

  const handleEndFileMarker = (content: string): void => {
    if (spinner?.isSpinning) {
      spinner.stop();
    }

    const trimmedContent = content.split(fileContentEndBoundary)[1].trimStart();
    debug('Handling end file marker', { content, fileContentEndBoundary, trimmedContent });
    process.stdout.write(chalk.white(trimmedContent));

    lastContent = trimmedContent;
    isCodeContent = false;
  };

  const handleNonCodeContent = (content: string): void => {
    process.stdout.write(chalk.white(content));
    lastContent = content;
  };

  const stopStream = (): void => {
    if (spinner?.isSpinning) {
      spinner.stop();
    }

    blankLine();

    if (!lastContent.includes('\n')) {
      blankLine();
    }
  };

  return { streamChunkContent, stopStream };
};
