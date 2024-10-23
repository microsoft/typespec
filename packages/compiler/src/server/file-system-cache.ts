import { FileEvent } from "vscode-languageserver";
import { SourceFile } from "../core/types.js";
import { FileService } from "./file-service.js";
import { ServerLog } from "./types.js";

export interface FileSystemCache {
  get(path: string): Promise<CachedFile | CachedError | undefined>;
  set(path: string, entry: CachedFile | CachedError): void;
  setData(path: string, data: any): Promise<void>;
  notify(changes: FileEvent[]): void;
}

export interface CachedFile {
  type: "file";
  file: SourceFile;
  version?: number;

  // Cache additional data beyond the raw text of the source file. Currently
  // used only for JSON.parse result of package.json.
  data?: any;
}

export interface CachedError {
  type: "error";
  error: unknown;
  data?: any;
  version?: undefined;
}
export function createFileSystemCache({
  fileService,
  log,
}: {
  fileService: FileService;
  log: (log: ServerLog) => void;
}): FileSystemCache {
  const cache = new Map<string, CachedFile | CachedError>();
  let changes: FileEvent[] = [];
  return {
    async get(path: string) {
      for (const change of changes) {
        const path = await fileService.fileURLToRealPath(change.uri);
        log({
          level: "trace",
          message: `FileSystemCache entry with key '${path}' removed`,
        });
        cache.delete(path);
      }
      changes = [];
      const r = cache.get(path);
      if (!r) {
        let callstack: string | undefined;
        try {
          const target: any = {};
          // some browser doesn't support Error.captureStackTrace (i.e. Firefox)
          if (typeof Error.captureStackTrace === "function") {
            Error.captureStackTrace(target);
            callstack = target.stack.substring("Error\n".length);
          }
        } catch {
          // just ignore the error, we don't want tracing error to impact normal functionality
        }
        log({ level: "trace", message: `FileSystemCache miss for ${path}`, detail: callstack });
      }
      return r;
    },
    set(path: string, entry: CachedFile | CachedError) {
      cache.set(path, entry);
    },
    async setData(path: string, data: any) {
      const entry = await this.get(path);
      if (entry) {
        entry.data = data;
      }
    },
    notify(events: FileEvent[]) {
      changes.push(...events);
    },
  };
}
