/* eslint-disable n/no-unpublished-import */
import globals from 'globals';
import pluginJs from '@eslint/js';
import typescriptEslint from 'typescript-eslint';
import promisePlugin from 'eslint-plugin-promise';
import nodePlugin from 'eslint-plugin-n';
import jestPlugin from 'eslint-plugin-jest';
import typescriptParser from '@typescript-eslint/parser';

import { includeIgnoreFile } from '@eslint/compat';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, '.gitignore');

export default [
  includeIgnoreFile(gitignorePath),
  {
    files: ['src/**/*.{js,mjs,cjs,ts}'],
    languageOptions: {
      parser: typescriptParser,
      globals: globals.node,
      ecmaVersion: 5,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json'
      }
    }
  },
  pluginJs.configs.recommended,
  ...typescriptEslint.configs.recommended,
  nodePlugin.configs['flat/recommended'],
  promisePlugin.configs['flat/recommended'],
  jestPlugin.configs['flat/recommended'],
  {
    files: ['**/*.ts'],
    rules: {
      'n/no-missing-import': 'off',
      'n/no-process-exit': 'off',
      'n/hashbang': 'off'
    }
  }
];
