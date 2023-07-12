import { resolve } from "path";
import { logDiagnostics } from "../../../diagnostics.js";
import { resolveTypeSpecEntrypoint } from "../../../entrypoint-resolution.js";
import { CompilerOptions } from "../../../options.js";
import { resolvePath } from "../../../path-utils.js";
import { Program, compile as compileProgram } from "../../../program.js";
import { CompilerHost, Diagnostic } from "../../../types.js";
import {
  createCLICompilerHost,
  handleInternalCompilerError,
  logDiagnosticCount,
} from "../../utils.js";
import { CompileCliArgs, getCompilerOptions } from "./args.js";
import { ProjectWatcher, WatchHost, createWatchHost, createWatcher } from "./watch.js";

export async function compileAction(args: CompileCliArgs & { path: string; pretty?: boolean }) {
  const host = createCLICompilerHost(args);
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

  const program = await compileInput(host, entrypoint, cliOptions);
  if (program.hasError()) {
    process.exit(1);
  }
  if (program.emitters.length === 0 && !program.compilerOptions.noEmit) {
    // eslint-disable-next-line no-console
    console.log(
      "No emitter was configured, no output was generated. Use `--emit <emitterName>` to pick emitter or specify it in the typespec config."
    );
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
  if (options === undefined) {
    logDiagnosticCount(diagnostics);
    process.exit(1);
  }

  return options;
}

function compileInput(
  host: CompilerHost,
  path: string,
  compilerOptions: CompilerOptions,
  printSuccess = true
): Promise<Program> {
  let compileRequested: boolean = false;
  let currentCompilePromise: Promise<Program> | undefined = undefined;
  const log = (message?: any, ...optionalParams: any[]) => {
    const prefix = compilerOptions.watchForChanges ? `[${new Date().toLocaleTimeString()}] ` : "";
    // eslint-disable-next-line no-console
    console.log(`${prefix}${message}`, ...optionalParams);
  };

  const runCompilePromise = () => {
    // Don't run the compiler if it's already running
    if (!currentCompilePromise) {
      // Clear the console before compiling in watch mode
      if (compilerOptions.watchForChanges) {
        // eslint-disable-next-line no-console
        console.clear();
      }

      currentCompilePromise = compileProgram(host, resolve(path), compilerOptions)
        .then(onCompileFinished)
        .catch(handleInternalCompilerError);
    } else {
      compileRequested = true;
    }

    return currentCompilePromise;
  };

  const runCompile = () => void runCompilePromise();

  let watcher: ProjectWatcher;
  let watchHost: WatchHost;

  const onCompileFinished = (program: Program) => {
    watchHost?.forceJSReload();
    watcher?.updateWatchedFiles([...program.sourceFiles.keys(), ...program.jsSourceFiles.keys()]);
    if (program.diagnostics.length > 0) {
      log("Diagnostics were reported during compilation:\n");
      logDiagnostics(program.diagnostics, host.logSink);
      logDiagnosticCount(program.diagnostics);
    } else {
      if (printSuccess) {
        log("Compilation completed successfully.");
      }
    }

    // eslint-disable-next-line no-console
    console.log(); // Insert a newline
    currentCompilePromise = undefined;
    if (compilerOptions.watchForChanges && compileRequested) {
      compileRequested = false;
      runCompile();
    }

    return program;
  };

  if (compilerOptions.watchForChanges) {
    watchHost = host = createWatchHost();
    watcher = createWatcher((_name: string) => {
      runCompile();
    });
    runCompile();
    return new Promise((resolve, reject) => {
      // Handle Ctrl+C for termination
      process.on("SIGINT", () => {
        watcher.close();
        // eslint-disable-next-line no-console
        console.info("Terminating watcher...\n");
      });
    });
  } else {
    return runCompilePromise();
  }
}
