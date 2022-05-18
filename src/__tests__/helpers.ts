import { execaSync, ExecaSyncReturnValue } from 'execa';
import path from 'path';
import { fileURLToPath } from 'url';

// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const TEST_CLI_PATH = path.resolve(__dirname, '../cli.ts');

type RunOptions = {
  nodeOptions?: string;
  nodePath?: string;
  timeout?: number; // kill the process after X milliseconds
  expectedFailure?: boolean;
};

type SpawnOptions = RunOptions & {
  cwd: string;
};

type SpawnFunction<T> = (
  execPath: string,
  args: string[],
  options: SpawnOptions
) => T;

/**
 * Helper function to run CLI command in a given folder
 */
export function runCLI(
  dir: string,
  args?: string[],
  options: RunOptions = {
    expectedFailure: false,
  }
): ExecaSyncReturnValue {
  return spawnScript(
    process.execPath,
    ['--loader', 'ts-node/esm', TEST_CLI_PATH, ...(args || [])],
    {
      ...options,
      cwd: dir,
    }
  );
}

export const spawnScript: SpawnFunction<ExecaSyncReturnValue> = (
  execPath,
  args,
  options
) => {
  const result = execaSync(execPath, args, getExecaOptions(options));

  handleTestFailure(execPath, options, result, args);

  return result;
};

function getExecaOptions(options: SpawnOptions) {
  const isRelative = !path.isAbsolute(options.cwd);

  const cwd = isRelative ? path.resolve(__dirname, options.cwd) : options.cwd;

  const env = Object.assign({}, process.env, { FORCE_COLOR: '0' });

  if (options.nodeOptions) {
    env.NODE_OPTIONS = options.nodeOptions;
  }
  if (options.nodePath) {
    env.NODE_PATH = options.nodePath;
  }

  return {
    cwd,
    env,
    reject: false,
    timeout: options.timeout || 0,
  };
}

function handleTestFailure(
  cmd: string,
  options: SpawnOptions,
  result: Record<string, any>,
  args: string[] | undefined
) {
  if (!options.expectedFailure && result.code !== 0) {
    console.log(`Running ${cmd} command failed for unexpected reason. Here's more info:
${'cmd:'}     ${cmd}
${'options:'} ${JSON.stringify(options)}
${'args:'}    ${(args || []).join(' ')}
${'stderr:'}  ${result.stderr}
${'stdout:'}  ${result.stdout}
${'code:'}    ${result.code}`);
  }
}
