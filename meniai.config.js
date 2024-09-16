import prettierExamplePlugin from './plugins/prettier-example-plugin.js';
import lintExamplePlugin from './plugins/lint-example-plugin.js';
import tscExamplePlugin from './plugins/tsc-example-plugin.js';
import jestExamplePlugin from './plugins/jest-example-plugin.js';

const config = {
  plugins: [prettierExamplePlugin, lintExamplePlugin, tscExamplePlugin, jestExamplePlugin],
  llm: 'claude',
  model: 'claude-3-5-sonnet-20240620'
  // Other configuration options...
};

export default config;
