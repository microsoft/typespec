import { mkdir, readdir, readFile, realpath, rm, stat, writeFile } from "fs/promises";
import { fileURLToPath, pathToFileURL } from "url";
import { createSourceFile } from "./diagnostics.js";
import { fetch } from "./fetch.js";
import { createConsoleSink } from "./logger/index.js";
import { joinPaths } from "./path-utils.js";
import { CompilerHost, RmOptions } from "./types.js";
import { findProjectRoot, getSourceFileKindFromExt } from "./util.js";

export const CompilerPackageRoot = (await findProjectRoot(stat, fileURLToPath(import.meta.url)))!;

/**
 * Implementation of the @see CompilerHost using the real file system.
 * This is the the CompilerHost used by TypeSpec CLI.
 */
export const NodeHost: CompilerHost = {
  readUrl: async (url: string) => {
    const response = await fetch(url);
    const text = await response.text();
    return createSourceFile(text, response.url);
  },
  readFile: async (path: string) => createSourceFile(await readUtf8File(path), path),
  writeFile: (path: string, content: string) => writeFile(path, content, { encoding: "utf-8" }),
  readDir: (path: string) => readdir(path),
  rm: (path: string, options: RmOptions) => rm(path, options),
  getExecutionRoot: () => CompilerPackageRoot,
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
  mkdirp: (path: string) => mkdir(path, { recursive: true }),
  logSink: createConsoleSink(),
  fileURLToPath,
  pathToFileURL(path: string) {
    return pathToFileURL(path).href;
  },
};

async function readUtf8File(path: string) {
  const buffer = await readFile(path);
  const len = buffer.length;
  if (len >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    throw new InvalidEncodingError("UTF-16 BE");
  }
  if (len >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    throw new InvalidEncodingError("UTF-16 LE");
  }
  if (len >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    // UTF-8 byte order mark detected
    return buffer.toString("utf8", 3);
  }
  // Default is UTF-8 with no byte order mark
  return buffer.toString("utf8");
}

export class InvalidEncodingError extends Error {
  constructor(encoding: string) {
    super(`Invalid encoding ${encoding}. TypeSpec only supports UTF-8 and UTF-8 with bom`);
  }
}
