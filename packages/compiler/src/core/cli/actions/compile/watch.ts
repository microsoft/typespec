import { FSWatcher, WatchEventType, watch } from "fs";
import { pathToFileURL } from "url";
import { NodeHost } from "../../../node-host.js";
import { CompilerHost } from "../../../types.js";

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
  onFileChanged: (event: WatchEventType, name: string) => void
): ProjectWatcher {
  const current = new Map<string, FSWatcher>();
  const dupFilter = createDupsFilter();
  return { updateWatchedFiles, close };

  function watchFile(file: string): FSWatcher {
    const watcher = watch(
      file,
      dupFilter((event: WatchEventType, _name: string) => {
        onFileChanged(event, file);
      })
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

export function createWatchHost(): WatchHost {
  let count = 0;
  return {
    ...NodeHost,
    forceJSReload,
    getJsImport: (path: string) => import(pathToFileURL(path).href + `?=${count}`),
  };
  function forceJSReload() {
    count++;
  }
}
function createDupsFilter() {
  let memo: Record<string, [WatchEventType, string]> = {};
  return function (fn: (e: WatchEventType, name: string) => void) {
    return function (event: WatchEventType, name: string) {
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
