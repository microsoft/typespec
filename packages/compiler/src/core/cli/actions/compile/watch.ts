import { FSWatcher, WatchEventType, watch } from "fs";
import { pathToFileURL } from "url";
import { CompilerHost } from "../../../types.js";
import { CliCompilerHost } from "../../types.js";

export interface ProjectWatcher {
  /** Set the files to watch. */
  readonly updateWatchedFiles: (files: string[]) => void;

  /** Close the watcher. */
  readonly close: () => void;
}

export interface WatchHost extends CompilerHost {
  forceJSReload(): void;
}

export function createWatcher(
  onFileChanged: (event: WatchEventType, name: string) => void,
): ProjectWatcher {
  const current = new Map<string, FSWatcher>();
  const dupFilter = createDupsFilter();
  return { updateWatchedFiles, close };

  function watchFile(file: string): FSWatcher {
    const watcher = watch(
      file,
      dupFilter((event: WatchEventType, _name: string | null) => {
        onFileChanged(event, file);
      }),
    );
    return watcher;
  }

  function close(): void {
    for (const watcher of current.values()) {
      watcher.close();
    }
  }

  function updateWatchedFiles(files: string[]) {
    const cleanup = new Set(current.keys());
    for (const file of files) {
      if (!current.has(file)) {
        current.set(file, watchFile(file));
      }
      cleanup.delete(file);
    }

    for (const file of cleanup) {
      current.get(file)?.close();
      current.delete(file);
    }
  }
}

export function createWatchHost(host: CliCompilerHost): WatchHost {
  let count = 0;
  return {
    ...host,
    forceJSReload,
    getJsImport: (path: string) => import(pathToFileURL(path).href + `?=${count}`),
  };
  function forceJSReload() {
    count++;
  }
}
function createDupsFilter() {
  let memo: Record<string, [WatchEventType, string]> = {};
  return function (fn: (e: WatchEventType, name: string | null) => void) {
    return function (event: WatchEventType, name: string | null) {
      if (name === null) {
        return;
      }
      memo[name] = [event, name];
      setTimeout(function () {
        Object.values(memo).forEach((args) => {
          fn(...args);
        });
        memo = {};
      });
    };
  };
}
