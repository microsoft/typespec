import { resolve } from "path";
import { logDiagnostics } from "../../../diagnostics.js";
import { resolveTypeSpecEntrypoint } from "../../../entrypoint-resolution.js";
import { CompilerOptions } from "../../../options.js";
import { resolvePath } from "../../../path-utils.js";
import { Program, compile as compileProgram } from "../../../program.js";
import { CompilerHost, Diagnostic } from "../../../types.js";
import { CliCompilerHost } from "../../types.js";
import {
  handleInternalCompilerError,
  logDiagnosticCount,
  logInternalCompilerError,
} from "../../utils.js";
import { CompileCliArgs, getCompilerOptions } from "./args.js";
import { ProjectWatcher, WatchHost, createWatchHost, createWatcher } from "./watch.js";

export async function compileAction(
  host: CliCompilerHost,
  args: CompileCliArgs & { path: string; pretty?: boolean }
) {
  const diagnostics: Diagnostic[] = [];
  const entrypoint = await resolveTypeSpecEntrypoint(
    host,
    resolvePath(process.cwd(), args.path),
    (diag) => diagnostics.push(diag)
  );
  if (entrypoint === undefined || diagnostics.length > 0) {
    logDiagnostics(diagnostics, host.logSink);
    process.exit(1);
  }
  const cliOptions = await getCompilerOptionsOrExit(host, entrypoint, args);

  if (args.watch) {
    await compileWatch(host, entrypoint, cliOptions);
  } else {
    await compileOnce(host, entrypoint, cliOptions);
  }
}

async function getCompilerOptionsOrExit(
  host: CompilerHost,
  entrypoint: string,
  args: CompileCliArgs
): Promise<CompilerOptions> {
  const [options, diagnostics] = await getCompilerOptions(
    host,
    entrypoint,
    process.cwd(),
    args,
    process.env
  );
  if (diagnostics.length > 0) {
    logDiagnostics(diagnostics, host.logSink);
  }
  if (options === undefined || diagnostics.length > 0) {
    logDiagnosticCount(diagnostics);
    process.exit(1);
  }

  return options;
}

async function compileOnce(
  host: CompilerHost,
  path: string,
  compilerOptions: CompilerOptions
): Promise<void> {
  try {
    const program = await compileProgram(host, resolve(path), compilerOptions);
    logProgramResult(host, program);
    if (program.hasError()) {
      process.exit(1);
    }
  } catch (e) {
    handleInternalCompilerError(e);
  }
}

function compileWatch(
  cliHost: CliCompilerHost,
  path: string,
  compilerOptions: CompilerOptions
): Promise<void> {
  const entrypoint = resolve(path);
  const watchHost: WatchHost = createWatchHost(cliHost);

  let compileRequested: boolean = false;
  let currentCompilePromise: Promise<Program | void> | undefined = undefined;

  const runCompilePromise = () => {
    // Don't run the compiler if it's already running
    if (currentCompilePromise === undefined) {
      // Clear the console before compiling in watch mode
      // eslint-disable-next-line no-console
      console.clear();

      watchHost?.forceJSReload();
      currentCompilePromise = compileProgram(watchHost, entrypoint, compilerOptions)
        .catch(logInternalCompilerError)
        .then(onCompileFinished);
    } else {
      compileRequested = true;
    }

    return currentCompilePromise;
  };

  const scheduleCompile = () => void runCompilePromise();

  const watcher: ProjectWatcher = createWatcher((_name: string) => {
    scheduleCompile();
  });
  watcher?.updateWatchedFiles([entrypoint]);

  const onCompileFinished = (program?: Program | void) => {
    if (program !== undefined) {
      watcher?.updateWatchedFiles([...program.sourceFiles.keys(), ...program.jsSourceFiles.keys()]);
      logProgramResult(watchHost, program, { showTimestamp: true });
    }

    currentCompilePromise = undefined;
    if (compileRequested) {
      compileRequested = false;
      scheduleCompile();
    }

    return program;
  };

  scheduleCompile();
  return new Promise((resolve, reject) => {
    // Handle Ctrl+C for termination
    process.on("SIGINT", () => {
      watcher.close();
      // eslint-disable-next-line no-console
      console.info("Terminating watcher...\n");
      resolve();
    });
  });
}

function logProgramResult(
  host: CompilerHost,
  program: Program,
  { showTimestamp }: { showTimestamp?: boolean } = {}
) {
  const log = (message?: any, ...optionalParams: any[]) => {
    const timestamp = showTimestamp ? `[${new Date().toLocaleTimeString()}] ` : "";
    // eslint-disable-next-line no-console
    console.log(`${timestamp}${message}`, ...optionalParams);
  };

  if (program.diagnostics.length > 0) {
    log("Diagnostics were reported during compilation:\n");
    logDiagnostics(program.diagnostics, host.logSink);
    logDiagnosticCount(program.diagnostics);
  } else {
    log("Compilation completed successfully.");
  }
  // eslint-disable-next-line no-console
  console.log(); // Insert a newline

  if (program.emitters.length === 0 && !program.compilerOptions.noEmit) {
    // eslint-disable-next-line no-console
    log(
      "No emitter was configured, no output was generated. Use `--emit <emitterName>` to pick emitter or specify it in the TypeSpec config."
    );
  }
}
