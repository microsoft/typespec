import fs from "fs";
import url, { fileURLToPath, pathToFileURL } from "url";
import { SymbolTable } from "./binder.js";
import { createDiagnostic, Diagnostic, DiagnosticError } from "./diagnostics.js";
import { CompilerHost, Sym } from "./types";
import { stat, readFile, mkdtemp, readdir, rmdir, realpath, writeFile } from "fs/promises";
import { join, resolve } from "path";

export const adlVersion = getVersion();

function getVersion(): string {
  const packageJsonPath = resolvePath(import.meta.url, "../../package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  return packageJson.version;
}

export function resolvePath(basePath: string, ...parts: string[]): string {
  const resolvedPath = new url.URL(parts.join(""), basePath);
  return url.fileURLToPath(resolvedPath);
}

export function reportDuplicateSymbols(symbols: SymbolTable) {
  let reported = new Set<Sym>();
  let diagnostics = new Array<Diagnostic>();

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
