import fs from "fs";
import { readdir, readFile, realpath, stat, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { fileURLToPath, pathToFileURL, URL } from "url";
import { createDiagnostic, DiagnosticError } from "./diagnostics.js";
import { CompilerHost, Diagnostic, Sym, SymbolTable } from "./types.js";

export const adlVersion = getVersion();

function getVersion(): string {
  const packageJsonPath = fileURLToPath(new URL("../../package.json", import.meta.url));
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  return packageJson.version;
}

export function reportDuplicateSymbols(symbols: SymbolTable) {
  let reported = new Set<Sym>();
  let diagnostics: Diagnostic[] = [];

  for (const symbol of symbols.duplicates) {
    report(symbol);
  }

  if (diagnostics.length > 0) {
    // TODO: We're now reporting all duplicates up to the binding of the first file
    // that introduced one, but still bailing the compilation rather than
    // recovering and reporting other issues including the possibility of more
    // duplicates.
    //
    // That said, decorators are entered into the global symbol table before
    // any source file is bound and therefore this will include all duplicate
    // decorator implementations.
    throw new DiagnosticError(diagnostics);
  }

  function report(symbol: Sym) {
    if (!reported.has(symbol)) {
      reported.add(symbol);
      const diagnostic = createDiagnostic("Duplicate name: " + symbol.name, symbol);
      diagnostics.push(diagnostic);
    }
  }
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

export const NodeHost: CompilerHost = {
  readFile: (path: string) => readFile(path, "utf-8"),
  readDir: (path: string) => readdir(path, { withFileTypes: true }),
  writeFile: (path: string, content: string) => writeFile(path, content, { encoding: "utf-8" }),
  getCwd: () => process.cwd(),
  getExecutionRoot: () => resolve(fileURLToPath(import.meta.url), "../../../"),
  getJsImport: (path: string) => import(pathToFileURL(path).href),
  getLibDirs() {
    const rootDir = this.getExecutionRoot();
    return [join(rootDir, "lib"), join(rootDir, "dist/lib")];
  },
  stat(path: string) {
    return stat(path);
  },
  realpath(path) {
    return realpath(path);
  },
};
