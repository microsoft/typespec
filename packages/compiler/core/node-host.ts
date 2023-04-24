import { readdir, readFile, realpath, rm, stat, writeFile } from "fs/promises";
import mkdirp from "mkdirp";
import { fileURLToPath, pathToFileURL } from "url";
import { createSourceFile } from "./diagnostics.js";
import { createConsoleSink } from "./logger/index.js";
import { joinPaths, resolvePath } from "./path-utils.js";
import { CompilerHost, RmOptions } from "./types.js";
import { getSourceFileKindFromExt } from "./util.js";

declare global {
  // Missing native fetch type https://github.com/DefinitelyTyped/DefinitelyTyped/issues/60924
  function fetch(...args: any[]): Promise<any>;
}

/**
 * Implementation of the @see CompilerHost using the real file system.
 * This is the the CompilerHost used by TypeSpec CLI.
 */
export const NodeHost: CompilerHost = {
  readUrl: async (url: string) => {
    const response = await fetch(url);
    const text = await response.text();
    return createSourceFile(text, url);
  },
  readFile: async (path: string) => createSourceFile(await readFile(path, "utf-8"), path),
  writeFile: (path: string, content: string) => writeFile(path, content, { encoding: "utf-8" }),
  readDir: (path: string) => readdir(path),
  rm: (path: string, options: RmOptions) => rm(path, options),
  getExecutionRoot: () => resolvePath(fileURLToPath(import.meta.url), "../../../"),
  getJsImport: (path: string) => import(pathToFileURL(path).href),
  getLibDirs() {
    const rootDir = this.getExecutionRoot();
    return [joinPaths(rootDir, "lib")];
  },
  stat(path: string) {
    return stat(path);
  },
  realpath(path) {
    return realpath(path);
  },
  getSourceFileKind: getSourceFileKindFromExt,
  logSink: createConsoleSink(),
  mkdirp: (path: string) => mkdirp(path) as any,
  fileURLToPath,
  pathToFileURL(path: string) {
    return pathToFileURL(path).href;
  },
};
