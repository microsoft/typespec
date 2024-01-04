import { FileEvent } from "vscode-languageserver";
import { SourceFile } from "../core/types.js";
import { FileService } from "./file-service.js";

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
}: {
  fileService: FileService;
}): FileSystemCache {
  const cache = new Map<string, CachedFile | CachedError>();
  let changes: FileEvent[] = [];
  return {
    async get(path: string) {
      for (const change of changes) {
        const path = await fileService.fileURLToRealPath(change.uri);
        cache.delete(path);
      }
      changes = [];
      return cache.get(path);
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
    notify(changes: FileEvent[]) {
      changes.push(...changes);
    },
  };
}
