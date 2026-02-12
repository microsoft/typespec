import { DiagnosticHandler } from "../core/diagnostics.js";
import { createDiagnostic } from "../core/messages.js";
import { getDirectoryPath, joinPaths } from "../core/path-utils.js";
import { createSourceFile } from "../core/source-file.js";
import {
  CompilerHost,
  Diagnostic,
  DiagnosticTarget,
  NoTarget,
  SourceFile,
  SystemHost,
} from "../core/types.js";

export interface FileHandlingOptions {
  allowFileNotFound?: boolean;
  diagnosticTarget?: DiagnosticTarget | typeof NoTarget;
  jsDiagnosticTarget?: DiagnosticTarget;
}

export async function doIO<T>(
  action: (path: string) => Promise<T>,
  path: string,
  reportDiagnostic: DiagnosticHandler,
  options?: FileHandlingOptions,
): Promise<T | undefined> {
  let result;
  try {
    result = await action(path);
  } catch (e: any) {
    let diagnostic: Diagnostic;
    let target = options?.diagnosticTarget ?? NoTarget;

    // blame the JS file, not the TypeSpec import statement for JS syntax errors.
    if (e instanceof SyntaxError && options?.jsDiagnosticTarget) {
      target = options.jsDiagnosticTarget;
    }

    switch (e.code) {
      case "ENOENT":
        if (options?.allowFileNotFound) {
          return undefined;
        }
        diagnostic = createDiagnostic({ code: "file-not-found", target, format: { path } });
        break;
      default:
        diagnostic = createDiagnostic({
          code: "file-load",
          target,
          format: { message: e.message },
        });
        break;
    }

    reportDiagnostic(diagnostic);
    return undefined;
  }

  return result;
}

export async function loadFile<T>(
  host: SystemHost,
  path: string,
  load: (contents: string) => T,
  reportDiagnostic: DiagnosticHandler,
  options?: FileHandlingOptions,
): Promise<[T | undefined, SourceFile]> {
  const file = await doIO(host.readFile, path, reportDiagnostic, options);
  if (!file) {
    return [undefined, createSourceFile("", path)];
  }
  let data: T;
  try {
    data = load(file.text);
  } catch (e: any) {
    reportDiagnostic({
      code: "file-load",
      message: e.message,
      severity: "error",
      target: { file, pos: 1, end: 1 },
    });
    return [undefined, file];
  }

  return [data, file];
}

/**
 * Look for the project root by looking up until a `package.json` is found.
 * @param path Path to start looking
 * @param lookIn
 */
export async function findProjectRoot(
  statFn: CompilerHost["stat"],
  path: string,
): Promise<string | undefined> {
  let current = path;
  while (true) {
    const pkgPath = joinPaths(current, "package.json");
    const stat = await doIO(
      () => statFn(pkgPath),
      pkgPath,
      () => {},
    );
    if (stat?.isFile()) {
      return current;
    }
    const parent = getDirectoryPath(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}
