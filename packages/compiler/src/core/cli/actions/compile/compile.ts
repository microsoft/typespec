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

export async function compileAction(host: CliCompilerHost, args: CompileCliArgs) {
  const diagnostics: Diagnostic[] = [];
  const entrypoint = await resolveTypeSpecEntrypoint(
    host,
    resolvePath(process.cwd(), args.path),
    (diag) => diagnostics.push(diag),
  );
  if (entrypoint === undefined || diagnostics.length > 0) {
    logDiagnostics(diagnostics, host.logSink);
    process.exit(1);
  }

  if (args.watch) {
    await compileWatch(host, entrypoint, args);
  } else {
    await compileOnce(host, entrypoint, args);
  }
}

async function getCompilerOptionsOrExit(
  host: CompilerHost,
  entrypoint: string,
  args: CompileCliArgs,
): Promise<CompilerOptions> {
  const [options, diagnostics] = await getCompilerOptions(
    host,
    entrypoint,
    process.cwd(),
    args,
    process.env,
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
  entrypoint: string,
  args: CompileCliArgs,
): Promise<void> {
  const cliOptions = await getCompilerOptionsOrExit(host, entrypoint, args);
  try {
    const program = await compileProgram(host, entrypoint, cliOptions);
    logProgramResult(host, program);
    if (program.hasError()) {
      process.exit(1);
    }
  } catch (e) {
    handleInternalCompilerError(e);
  }
}

async function compileWatch(
  cliHost: CliCompilerHost,
  entrypoint: string,
  args: CompileCliArgs,
): Promise<void> {
  const compilerOptions = await getCompilerOptionsOrExit(cliHost, entrypoint, args);

  const watchHost: WatchHost = createWatchHost(cliHost);

  let compileRequested: boolean = false;
  let currentCompilePromise: Promise<Program | NoProgram | void> | undefined = undefined;

  const runCompilePromise = () => {
    // Don't run the compiler if it's already running
    if (currentCompilePromise === undefined) {
      // Clear the console before compiling in watch mode
      // eslint-disable-next-line no-console
      console.clear();

      watchHost?.forceJSReload();
      const run = async (): Promise<Program | NoProgram> => {
        const [newCompilerOptions, diagnostics] = await getCompilerOptions(
          watchHost,
          entrypoint,
          process.cwd(),
          { ...args, config: compilerOptions.config },
          process.env,
        );
        if (diagnostics.length > 0) {
          return { diagnostics };
        }
        return await compileProgram(watchHost, entrypoint, newCompilerOptions);
      };
      currentCompilePromise = run().catch(logInternalCompilerError).then(onCompileFinished);
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

  const onCompileFinished = (program?: Program | NoProgram | void) => {
    if (program !== undefined) {
      if ("sourceFiles" in program) {
        watcher?.updateWatchedFiles(resolveFilesToWatch(program));
      }
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

function resolveFilesToWatch(program: Program): string[] {
  const files = [...program.sourceFiles.keys(), ...program.jsSourceFiles.keys()];
  if (program.compilerOptions.config) {
    files.push(program.compilerOptions.config);
  }
  return files;
}

interface NoProgram {
  readonly diagnostics: readonly Diagnostic[];
}

function logProgramResult(
  host: CompilerHost,
  program: Program | NoProgram,
  { showTimestamp }: { showTimestamp?: boolean } = {},
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

  if ("emitters" in program && program.emitters.length === 0 && !program.compilerOptions.noEmit) {
    log(
      "No emitter was configured, no output was generated. Use `--emit <emitterName>` to pick emitter or specify it in the TypeSpec config.",
    );
  }
}
