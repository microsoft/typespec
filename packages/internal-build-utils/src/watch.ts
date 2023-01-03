import chokidar from "chokidar";
import { resolve } from "path";
import { clearScreen, logWithTime } from "./common.js";

export function runWatch(pattern: string, build: any, options?: any) {
  let lastBuildTime: Date;
  pattern = resolve(pattern);

  start();

  function start() {
    // build once up-front
    runBuild();

    const watcher = chokidar.watch(pattern, { interval: 0.2, ...options });

    // then build again on any change
    watcher.on("add", (file) => runBuild(`${file} created`));
    watcher.on("removed", (file) => runBuild(`${file} removed`));
    watcher.on("change", (file, stats) => runBuild(`${file} changed`, stats?.mtime));
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
