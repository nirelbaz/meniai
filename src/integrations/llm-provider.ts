import { ChatGPT } from './chatgpt.js';
import { Claude } from './claude.js';
import { Context, LLMProvider } from '../types.js';
import { BaseLLM } from './base-llm.js';

export function llmProvider(llm: LLMProvider, context: Context | string): BaseLLM {
  switch (llm) {
    case 'openai':
      return new ChatGPT(context);
    case 'claude':
      return new Claude(context);
    default:
      throw new Error(`Invalid LLM: ${llm}`);
  }
}
