import { commandOptions, program } from '../../src/cli/command-options.js';

// Mock the process.argv
const mockProcessArgv = (args: string[]) => {
  const originalArgv = process.argv;
  process.argv = ['node', 'test.js', ...args];
  return () => {
    process.argv = originalArgv;
  };
};

describe('Command Options', () => {
  beforeEach(() => {
    // Reset commander options before each test
    program.opts();
  });

  test('General settings options', () => {
    const restore = mockProcessArgv([
      '--name',
      'TestBot',
      '--llm',
      'openai',
      '--model',
      'gpt-4',
      '--meniai-directory',
      './meniai',
      '--save-config',
      '--config-path',
      './config.json'
    ]);

    program.parse(process.argv);
    const options = commandOptions;

    expect(options.name).toBe('TestBot');
    expect(options.llm).toBe('openai');
    expect(options.model).toBe('gpt-4');
    expect(options.meniaiDirectory).toBe('./meniai');
    expect(options.saveConfig).toBe(true);
    expect(options.configPath).toBe('./config.json');

    restore();
  });

  test('File and directory settings options', () => {
    const restore = mockProcessArgv([
      '--input-dir',
      './input',
      '--exclude-files',
      'jpg,png',
      '--include-files',
      'ts,js',
      '--output-dir',
      './output',
      '--output-file-name',
      'result',
      '--output-file-ext',
      'md',
      '--examples-dir',
      './examples',
      '--num-examples',
      '5',
      '--context-dir',
      './context',
      '--context-files',
      'file1.txt,file2.txt',
      '--context-files-limit',
      '10'
    ]);

    program.parse(process.argv);
    const options = commandOptions;

    expect(options.inputDir).toBe('./input');
    expect(options.excludeFiles).toEqual(['jpg', 'png']);
    expect(options.includeFiles).toEqual(['ts', 'js']);
    expect(options.outputDir).toBe('./output');
    expect(options.outputFileName).toBe('result');
    expect(options.outputFileExt).toBe('md');
    expect(options.examplesDir).toBe('./examples');
    expect(options.numExamples).toBe(5);
    expect(options.contextDir).toBe('./context');
    expect(options.contextFiles).toEqual(['file1.txt', 'file2.txt']);
    expect(options.contextFilesLimit).toBe(10);

    restore();
  });

  test('Task processing settings options', () => {
    const restore = mockProcessArgv([
      '--mode',
      'update',
      '--divide-task-by',
      'folder',
      '--recursive',
      '--include-subfolder-contents',
      '--ask-before-proceeding',
      '--limit',
      '20',
      '--filter-tasks',
      'task1,task2',
      '--iterations',
      '3'
    ]);

    program.parse(process.argv);
    const options = commandOptions;

    expect(options.mode).toBe('update');
    expect(options.divideTaskBy).toBe('folder');
    expect(options.recursive).toBe(true);
    expect(options.includeSubfolderContents).toBe(true);
    expect(options.askBeforeProceeding).toBe(true);
    expect(options.limit).toBe(20);
    expect(options.filterTasks).toEqual(['task1', 'task2']);
    expect(options.iterations).toBe(3);

    restore();
  });

  test('Interaction and feedback settings options', () => {
    const restore = mockProcessArgv([
      '--interactive',
      '--feedback-max-length',
      '1000',
      '--feedback-max-iterations',
      '5',
      '--summarize-feedback'
    ]);

    program.parse(process.argv);
    const options = commandOptions;

    expect(options.interactive).toBe(true);
    expect(options.feedbackMaxLength).toBe(1000);
    expect(options.feedbackMaxIterations).toBe(5);
    expect(options.summarizeFeedback).toBe(true);

    restore();
  });

  test('LLM response handling options', () => {
    const restore = mockProcessArgv(['--file-content-start-boundary', '<<<START>>>', '--file-content-end-boundary', '<<<END>>>']);

    program.parse(process.argv);
    const options = commandOptions;

    expect(options.fileContentStartBoundary).toBe('<<<START>>>');
    expect(options.fileContentEndBoundary).toBe('<<<END>>>');

    restore();
  });

  test('Debug and logging options', () => {
    const restore = mockProcessArgv(['--debug']);

    program.parse(process.argv);
    const options = commandOptions;

    expect(options.debug).toBe(true);

    restore();
  });

  test('External services and integrations options', () => {
    const restore = mockProcessArgv(['--publish-pr']);

    program.parse(process.argv);
    const options = commandOptions;

    expect(options.publishPr).toBe(true);

    restore();
  });

  test('Plugins options', () => {
    const restore = mockProcessArgv(['--enable-plugins', 'plugin1,plugin2']);

    program.parse(process.argv);
    const options = commandOptions;

    expect(options.enablePlugins).toEqual(['plugin1', 'plugin2']);

    restore();
  });

  test('Disabling boolean options', () => {
    const restore = mockProcessArgv(['--no-recursive', '--no-ask-before-proceeding', '--no-interactive', '--no-publish-pr']);

    program.parse(process.argv);
    const options = commandOptions;

    expect(options.recursive).toBe(false);
    expect(options.askBeforeProceeding).toBe(false);
    expect(options.interactive).toBe(false);
    expect(options.publishPr).toBe(false);

    restore();
  });
});
