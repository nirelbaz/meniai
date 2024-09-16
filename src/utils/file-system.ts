import fs from 'fs/promises';
import path from 'path';
import debugProvider from 'debug';
import { yesNoQuestion } from '../cli/chat.js';

const debug = debugProvider('MeniAI:FileSystem');

type CreateIfNotExist = boolean | 'force';

export async function readFile(
  filePath: string,
  createIfNotExist: CreateIfNotExist = false,
  logError: boolean = true
): Promise<string | undefined> {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      debug(`Path "${filePath}" does not lead to a file`);
      return undefined;
    }
    return await fs.readFile(filePath, 'utf-8');
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      if (await handleNonExistentPath(filePath, createIfNotExist, 'file')) {
        return '';
      }
    } else if (logError) {
      console.error(error, { path: filePath, action: 'Error reading file' });
    }
    return undefined;
  }
}

export async function writeFile(filePath: string, content: string, createIfNotExist: CreateIfNotExist = false): Promise<boolean> {
  try {
    await fs.writeFile(filePath, content);
    return true;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      if (await handleNonExistentPath(path.dirname(filePath), createIfNotExist, 'directory')) {
        await fs.writeFile(filePath, content);
        return true;
      }
    } else {
      console.error(error, { path: filePath, action: 'Error writing file' });
    }
    return false;
  }
}

export async function readDirectoryFiles(
  directoryPath: string,
  recursive: boolean = false,
  createIfNotExist: CreateIfNotExist = false
): Promise<string[] | undefined> {
  try {
    const stats = await fs.stat(directoryPath);
    if (!stats.isDirectory()) {
      debug(`Path "${directoryPath}" does not lead to a directory`);
      return undefined;
    }

    const files = await fs.readdir(directoryPath, { withFileTypes: true });
    const filePaths = await Promise.all(
      files.map(async (file) => {
        const fullPath = path.join(directoryPath, file.name);
        if (file.isDirectory() && recursive) {
          const subDirFiles = await readDirectoryFiles(fullPath, true);
          return subDirFiles || [];
        }
        return file.isFile() ? [fullPath] : [];
      })
    );

    return filePaths.flat();
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      if (await handleNonExistentPath(directoryPath, createIfNotExist, 'directory')) {
        return [];
      }
    }
    console.error(error, { path: directoryPath, action: 'Error reading directory' });
    return undefined;
  }
}

export async function readSubDirectories(
  directoryPath: string,
  recursive: boolean = false,
  createIfNotExist: CreateIfNotExist = false
): Promise<string[] | undefined> {
  try {
    const stats = await fs.stat(directoryPath);
    if (!stats.isDirectory()) {
      debug(`Path "${directoryPath}" does not lead to a directory`);
      return undefined;
    }

    const files = await fs.readdir(directoryPath, { withFileTypes: true });
    const subDirectories = await Promise.all(
      files.map(async (file) => {
        const fullPath = path.join(directoryPath, file.name);
        if (file.isDirectory()) {
          const subDirs = recursive ? await readSubDirectories(fullPath, true) : [];
          return [fullPath, ...(subDirs || [])];
        }
        return [];
      })
    );

    return subDirectories.flat();
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') {
      if (await handleNonExistentPath(directoryPath, createIfNotExist, 'directory')) {
        return [];
      }
    }
    console.error(error, { path: directoryPath, action: 'Error reading directory' });
    return undefined;
  }
}

async function handleNonExistentPath(path: string, createIfNotExist: CreateIfNotExist, type: 'file' | 'directory'): Promise<boolean> {
  if (createIfNotExist !== true && createIfNotExist !== 'force') return false;

  const shouldCreate = createIfNotExist === 'force' || (await yesNoQuestion(`${type} does not exist. Create ${type} at ${path}?`));

  if (shouldCreate) {
    if (type === 'file') {
      await writeFile(path, '');
    } else {
      await createDirectory(path, true);
    }
    return true;
  }

  return false;
}

export async function createDirectory(directoryPath: string, recursive: boolean = false): Promise<boolean> {
  try {
    await fs.mkdir(directoryPath, { recursive });
    return true;
  } catch (error: unknown) {
    console.error(error, { path: directoryPath, action: 'Error creating directory' });
    return false;
  }
}

export function removeExtension(filename: string): string {
  return filename.substring(0, filename.lastIndexOf('.')) || filename;
}
