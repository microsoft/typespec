import watch from "node-watch";
import { resolve } from "path";
import { logDiagnostics } from "../../../diagnostics.js";
import { resolveTypeSpecEntrypoint } from "../../../entrypoint-resolution.js";
import { CompilerOptions } from "../../../options.js";
import { getAnyExtensionFromPath, resolvePath } from "../../../path-utils.js";
import { Program, compile as compileProgram } from "../../../program.js";
import { CompilerHost, Diagnostic } from "../../../types.js";
import { CliCompilerHost } from "../../types.js";
import { handleInternalCompilerError, logDiagnosticCount } from "../../utils.js";
import { CompileCliArgs, getCompilerOptions } from "./args.js";

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

  const onCompileFinished = (program: Program) => {
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
    runCompile();
    return new Promise((resolve, reject) => {
      const watcher = (watch as any)(
        path,
        {
          recursive: true,
          filter: (f: string) =>
            [".js", ".tsp", ".cadl"].indexOf(getAnyExtensionFromPath(f)) > -1 &&
            !/node_modules/.test(f),
        },
        (e: any, name: string) => {
          runCompile();
        }
      );

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
