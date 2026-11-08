import { statSync, watch, type WatchOptions } from "fs";
import { dirname, resolve } from "path";
import { clearScreen, logWithTime } from "./common.js";

export function runWatch(pattern: string, build: any, options?: WatchOptions) {
  let lastBuildTime: Date;
  pattern = resolve(pattern);

  start();

  function start() {
    // build once up-front
    runBuild();

    const isDirectory = statSync(pattern, { throwIfNoEntry: false })?.isDirectory() ?? false;
    // Watch a file's parent so replacing the file doesn't detach the watcher.
    const watchPath = isDirectory ? pattern : dirname(pattern);

    // then build again on any change
    watch(watchPath, { recursive: isDirectory, ...options }, (event, filename) => {
      const file = filename === null ? pattern : resolve(watchPath, filename.toString());
      if (!isDirectory && file !== pattern) {
        return;
      }
      const changeTime =
        event === "change" ? statSync(file, { throwIfNoEntry: false })?.mtime : undefined;
      runBuild(`${file} ${event === "rename" ? "created or removed" : "changed"}`, changeTime);
    });
  }

  function runBuild(changeDescription?: string, changeTime?: Date) {
    runBuildAsync(changeDescription, changeTime).catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err.stack);
      process.exit(1);
    });
  }

  async function runBuildAsync(changeDescription?: string, changeTime?: Date) {
    if (changeTime && lastBuildTime && changeTime < lastBuildTime) {
      // Don't rebuild if a change happened before the last build kicked off.
      // Defends against duplicate events and building more than once when a
      // bunch of files are changed at the same time.
      return;
    }

    lastBuildTime = new Date();
    if (changeDescription) {
      clearScreen();
      logWithTime(`File change detected: ${changeDescription}. Running build.`);
    } else {
      logWithTime("Starting build in watch mode.");
    }

    try {
      await build();
      logWithTime("Build succeeded. Waiting for file changes.");
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error(err.stack);
      logWithTime(`Build failed. Waiting for file changes.`);
    }
  }
}
