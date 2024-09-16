import chalk from 'chalk';
import ora, { Ora } from 'ora';
import readline from 'readline';

// Types
type MessageFunction = (message: string, stream?: boolean) => Promise<void>;
type SpinnerFunction = (message: string) => Ora;

// Enums
export enum MessageType {
  User = 'You',
  Assistant = 'MeniAI',
  System = 'System'
}

// Interfaces
interface MessageOptions {
  type: MessageType;
  color: chalk.Chalk;
}

// Constants
const TYPING_DELAY = 17;

// Helper functions
const createMessage =
  ({ type, color }: MessageOptions): MessageFunction =>
  async (message: string, stream: boolean = true): Promise<void> => {
    if (stream) {
      await streamMessage(type, color, message);
    } else {
      console.log(color.bold(`${type}: `) + chalk.white(message));
    }
    blankLine();
  };

const createSpinner =
  ({ type, color }: MessageOptions): SpinnerFunction =>
  (message: string): Ora =>
    ora({
      prefixText: color.bold(`${type}:`),
      text: chalk.white(message),
      color: color === chalk.greenBright ? 'green' : 'gray',
      spinner: 'sand',
      hideCursor: true
    }).start();

// Message functions
export const printUserMessage: MessageFunction = createMessage({ type: MessageType.User, color: chalk.blueBright });
export const printAssistantMessage: MessageFunction = createMessage({ type: MessageType.Assistant, color: chalk.greenBright });
export const printSystemMessage: MessageFunction = createMessage({ type: MessageType.System, color: chalk.gray });

// Spinner functions
export const assistantLoading: SpinnerFunction = createSpinner({ type: MessageType.Assistant, color: chalk.greenBright });
export const systemLoading: SpinnerFunction = createSpinner({ type: MessageType.System, color: chalk.gray });

// User input functions
export const promptUser = async (question: string): Promise<string> => {
  await printAssistantMessage(question);
  return getUserInput(MessageType.User);
};

export const yesNoQuestion = async (question: string): Promise<boolean> => {
  await printAssistantMessage(question);
  const answer = await getUserInput(MessageType.User, '(yes/no)');
  return answer.toLowerCase().startsWith('y');
};

// Utility functions
export const blankLine = (): void => console.log('');

const createReadline = (): readline.Interface => {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
};

export const clearTerminal = (): void => {
  console.clear();
};

// Function to stream messages with typing effect
const streamMessage = async (type: MessageType, color: chalk.Chalk, message: string): Promise<void> => {
  const coloredType = color.bold(`${type}: `);
  process.stdout.write(coloredType);

  let buffer = '';
  for (const char of message) {
    buffer += char;
    if (isAnsiEscapeSequence(buffer)) {
      continue;
    }
    process.stdout.write(buffer);
    buffer = '';
    if (char !== '\u001b') {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * TYPING_DELAY));
    }
  }
  if (buffer) {
    process.stdout.write(buffer);
  }
  process.stdout.write('\n');
};

const isAnsiEscapeSequence = (buffer: string): boolean => {
  return buffer.endsWith('\u001b[') || (buffer.startsWith('\u001b[') && !buffer.endsWith('m'));
};

// Helper function for user input
const getUserInput = (type: MessageType, suffix: string = ''): Promise<string> => {
  const prompt = chalk.blueBright.bold(`${type}: `) + (suffix ? chalk.gray(suffix) + ' ' : '');

  return new Promise((resolve) => {
    awaitUserInput(prompt, resolve);
  });
};

const awaitUserInput = (prompt: string, resolve: (answer: string) => void): void => {
  const rl = createReadline();
  rl.question(prompt, (answer) => {
    rl.close();

    // Wait for non-empty answer
    if (answer.trim() === '') {
      awaitUserInput('', resolve);
    } else {
      blankLine();
      resolve(answer);
    }
  });
};

export const deleteLastLine = (): void => {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
};
