import type { CompilerHost, LogSink, SourceFile } from "@typespec/compiler";
import {
  createSourceFile,
  getSourceFileKindFromExt,
} from "../../compiler/dist/src/core/source-file.js";
import * as intrinsicTspIndex from "../../compiler/dist/src/lib/intrinsic/tsp-index.js";
import * as stdTspIndex from "../../compiler/dist/src/lib/tsp-index.js";

export interface VirtualFile {
  path: string;
  contents: string;
}

/**
 * Creates an in-memory CompilerHost backed by a virtual filesystem.
 * Used for compile-virtual where all sources are provided in memory.
 */
export function createVirtualFsHost(
  files: VirtualFile[],
  libDirs: string[],
  logSink?: LogSink,
): CompilerHost {
  const jsImportMap = new Map<string, Record<string, any>>([
    ["/dist/src/lib/tsp-index.js", stdTspIndex as unknown as Record<string, any>],
    ["/dist/src/lib/intrinsic/tsp-index.js", intrinsicTspIndex as unknown as Record<string, any>],
  ]);

  const fileMap = new Map<string, string>();
  for (const file of files) {
    // Normalize paths to POSIX style
    const normalizedPath = file.path.replace(/\\/g, "/");
    fileMap.set(normalizedPath, file.contents);
  }

  // Ensure the JS stdlib indexes imported by compiler/lib/*.tsp appear to exist.
  for (const jsPath of jsImportMap.keys()) {
    if (!fileMap.has(jsPath)) {
      fileMap.set(jsPath, "");
    }
  }

  // Some compiler flows probe for a package.json at the execution root.
  // Provide a minimal one by default to avoid surfacing missing-file probes as internal errors.
  if (!fileMap.has("/package.json")) {
    fileMap.set("/package.json", JSON.stringify({ name: "virtual-project", private: true }));
  }

  // In-memory directory structure
  const dirs = new Set<string>();
  for (const path of fileMap.keys()) {
    let dir = getDirectoryPath(path);
    while (dir && dir !== "/" && dir !== ".") {
      dirs.add(dir);
      dir = getDirectoryPath(dir);
    }
  }

  const host: CompilerHost = {
    async readFile(path: string): Promise<SourceFile> {
      const normalizedPath = normalizePath(path);
      const contents = fileMap.get(normalizedPath);
      if (contents === undefined) {
        throw createFsError("ENOENT", `File not found: ${path}`, path);
      }
      return createSourceFile(contents, normalizedPath);
    },

    async readUrl(url: string): Promise<SourceFile> {
      throw new Error("URL loading not supported in virtual filesystem");
    },

    async writeFile(path: string, content: string): Promise<void> {
      const normalizedPath = normalizePath(path);
      fileMap.set(normalizedPath, content);

      // Ensure directory exists
      let dir = getDirectoryPath(normalizedPath);
      while (dir && dir !== "/" && dir !== ".") {
        dirs.add(dir);
        dir = getDirectoryPath(dir);
      }
    },

    async readDir(path: string): Promise<string[]> {
      const normalizedPath = normalizePath(path);
      const result: string[] = [];

      for (const filePath of fileMap.keys()) {
        const fileDir = getDirectoryPath(filePath);
        if (fileDir === normalizedPath) {
          const filename = filePath.substring(normalizedPath.length + 1);
          if (!filename.includes("/")) {
            result.push(filename);
          }
        }
      }

      for (const dir of dirs) {
        const dirParent = getDirectoryPath(dir);
        if (dirParent === normalizedPath) {
          const dirname = dir.substring(normalizedPath.length + 1);
          if (!dirname.includes("/")) {
            result.push(dirname);
          }
        }
      }

      return result;
    },

    async rm(path: string): Promise<void> {
      const normalizedPath = normalizePath(path);
      fileMap.delete(normalizedPath);
      dirs.delete(normalizedPath);
    },

    async mkdirp(path: string): Promise<string | undefined> {
      const normalizedPath = normalizePath(path);
      let dir = normalizedPath;
      while (dir && dir !== "/" && dir !== ".") {
        dirs.add(dir);
        dir = getDirectoryPath(dir);
      }
      return normalizedPath;
    },

    async stat(path: string): Promise<{ isDirectory(): boolean; isFile(): boolean }> {
      const normalizedPath = normalizePath(path);
      const isFile = fileMap.has(normalizedPath) || jsImportMap.has(normalizedPath);
      const isDirectory = dirs.has(normalizedPath);

      if (!isFile && !isDirectory) {
        throw createFsError("ENOENT", `Path not found: ${path}`, path);
      }

      return {
        isDirectory: () => isDirectory,
        isFile: () => isFile,
      };
    },

    async realpath(path: string): Promise<string> {
      return normalizePath(path);
    },

    getExecutionRoot(): string {
      return "/";
    },

    getLibDirs(): string[] {
      return libDirs;
    },

    async getJsImport(path: string): Promise<Record<string, any>> {
      const normalizedPath = normalizePath(path);
      const module = jsImportMap.get(normalizedPath);
      if (!module) {
        throw createFsError("ENOENT", `JS import not found: ${path}`, path);
      }
      return module;
    },

    getSourceFileKind(path: string) {
      return getSourceFileKindFromExt(path);
    },

    fileURLToPath(url: string): string {
      // Simple implementation - remove file:// prefix
      return url.replace(/^file:\/\//, "/");
    },

    pathToFileURL(path: string): string {
      // Simple implementation - add file:// prefix
      const normalized = normalizePath(path);
      return `file://${normalized}`;
    },

    logSink: logSink ?? createSimpleLogSink(),
  };

  return host;
}

/**
 * Creates a simple log sink for the virtual host
 */
function createSimpleLogSink(): LogSink {
  return {
    log(log) {
      // In WASM context, we might not have console, but for now just no-op
      if (typeof console !== "undefined") {
        const level = log.level;
        const message = log.message;

        if (level === "error") {
          // eslint-disable-next-line no-console
          console.error(message);
        } else if (level === "warning") {
          // eslint-disable-next-line no-console
          console.warn(message);
        } else {
          // eslint-disable-next-line no-console
          console.log(message);
        }
      }
    },
  };
}

/**
 * Gets the directory path from a file path
 */
function getDirectoryPath(path: string): string {
  const lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return "";
  if (lastSlash === 0) return "/";
  return path.substring(0, lastSlash);
}

/**
 * Normalizes a path to POSIX style
 */
function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

function createFsError(code: string, message: string, path: string): Error {
  const error = new Error(message) as Error & { code?: string; path?: string };
  error.code = code;
  error.path = path;
  return error;
}

/**
 * Creates an in-memory output sink for capturing emitted files
 */
export class VirtualOutputSink {
  private files = new Map<string, string>();

  getWrittenFile(path: string): string | undefined {
    return this.files.get(normalizePath(path));
  }

  getAllFiles(): Array<{ path: string; contents: string }> {
    return Array.from(this.files.entries()).map(([path, contents]) => ({
      path,
      contents,
    }));
  }

  clear(): void {
    this.files.clear();
  }
}
