import fs from "fs";
import { readFile, realpath, stat, writeFile } from "fs/promises";
import fetch from "node-fetch";
import { join, resolve } from "path";
import { fileURLToPath, pathToFileURL, URL } from "url";
import { createSourceFile, DiagnosticHandler } from "./diagnostics.js";
import { createConsoleSink } from "./logger.js";
import { createDiagnostic } from "./messages.js";
import { CompilerHost, Diagnostic, DiagnosticTarget, NoTarget, SourceFile } from "./types.js";

export const cadlVersion = getVersion();

function getVersion(): string {
  const packageJsonPath = fileURLToPath(new URL("../../package.json", import.meta.url));
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  return packageJson.version;
}

export function deepFreeze<T>(value: T): T {
  if (Array.isArray(value)) {
    value.map(deepFreeze);
  } else if (typeof value === "object") {
    for (const prop in value) {
      deepFreeze(value[prop]);
    }
  }

  return Object.freeze(value);
}

export function deepClone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(deepClone) as any;
  }

  if (typeof value === "object") {
    const obj: any = {};
    for (const prop in value) {
      obj[prop] = deepClone(value[prop]);
    }
    return obj;
  }

  return value;
}

export interface FileHandlingOptions {
  allowFileNotFound?: boolean;
  diagnosticTarget?: DiagnosticTarget;
  jsDiagnosticTarget?: DiagnosticTarget;
}

export async function doIO<T>(
  action: (path: string) => Promise<T>,
  path: string,
  reportDiagnostic: DiagnosticHandler,
  options?: FileHandlingOptions
): Promise<T | undefined> {
  let result;
  try {
    result = await action(path);
  } catch (e) {
    let diagnostic: Diagnostic;
    let target = options?.diagnosticTarget ?? NoTarget;

    // blame the JS file, not the Cadl import statement for JS syntax errors.
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
  host: CompilerHost,
  path: string,
  load: (contents: string) => T,
  reportDiagnostic: DiagnosticHandler,
  options?: FileHandlingOptions
): Promise<[T | undefined, SourceFile]> {
  const file = await doIO(host.readFile, path, reportDiagnostic, options);
  if (!file) {
    return [undefined, createSourceFile("", path)];
  }
  let data: T;
  try {
    data = load(file.text);
  } catch (e) {
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

export const NodeHost: CompilerHost = {
  readUrl: async (url: string) => {
    const response = await fetch(url);
    const text = await response.text();

    return createSourceFile(text, url);
  },
  readFile: async (path: string) => createSourceFile(await readFile(path, "utf-8"), path),
  writeFile: (path: string, content: string) => writeFile(path, content, { encoding: "utf-8" }),
  resolveAbsolutePath: (path: string) => resolve(path),
  getExecutionRoot: () => resolve(fileURLToPath(import.meta.url), "../../../"),
  getJsImport: (path: string) => import(pathToFileURL(path).href),
  getLibDirs() {
    const rootDir = this.getExecutionRoot();
    return [join(rootDir, "lib")];
  },
  stat(path: string) {
    return stat(path);
  },
  realpath(path) {
    return realpath(path);
  },
  logSink: createConsoleSink(),
};

export async function readUrlOrPath(host: CompilerHost, pathOrUrl: string): Promise<SourceFile> {
  if (isUrl(pathOrUrl)) {
    return host.readUrl(pathOrUrl);
  }
  return host.readFile(pathOrUrl);
}

function isUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
