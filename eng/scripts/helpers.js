import { spawn, spawnSync } from "child_process";
import { statSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

function read(filename) {
  const txt = readFileSync(filename, "utf8")
    .replace(/\r/gm, "")
    .replace(/\n/gm, "«")
    .replace(/\/\*.*?\*\//gm, "")
    .replace(/«/gm, "\n")
    .replace(/\s+\/\/.*/g, "");
  return JSON.parse(txt);
}

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const prettier = resolve(repoRoot, "packages/adl/node_modules/.bin/prettier");
export const tsc = resolve(repoRoot, "packages/adl/node_modules/.bin/tsc");

const rush = read(`${repoRoot}/rush.json`);

export function forEachProject(onEach) {
  // load all the projects
  for (const each of rush.projects) {
    const packageName = each.packageName;
    const projectFolder = resolve(`${repoRoot}/${each.projectFolder}`);
    const project = JSON.parse(readFileSync(`${projectFolder}/package.json`));
    onEach(packageName, projectFolder, project);
  }
}

export function npmForEach(cmd, options) {
  forEachProject((name, location, project) => {
    // checks for the script first
    if (project.scripts[cmd] || cmd === "pack") {
      const args = cmd === "pack" ? [cmd] : ["run", cmd];
      run("npm", args, { cwd: location, ...options });
    }
  });
}

// We could use { shell: true } to let Windows find .cmd, but that causes other issues.
// It breaks ENOENT checking for command-not-found and also handles command/args with spaces
// poorly.
const isCmdOnWindows = ["rush", "npm", "code", "code-insiders", tsc, prettier];

export class CommandFailedError extends Error {
  constructor(msg, proc) {
    super(msg);
    this.proc = proc;
  }
}

export function run(command, args, options) {
  console.log();
  console.log(`> ${command} ${args.join(" ")}`);

  options = {
    stdio: "inherit",
    sync: true,
    throwOnNonZeroExit: true,
    ...options,
  };

  if (process.platform === "win32" && isCmdOnWindows.includes(command)) {
    command += ".cmd";
  }

  const proc = (options.sync ? spawnSync : spawn)(command, args, options);
  if (proc.error) {
    if (options.ignoreCommandNotFound && proc.error.code === "ENOENT") {
      console.log(`Skipped: Command \`${command}\` not found.`);
    } else {
      throw proc.error;
    }
  } else if (options.throwOnNonZeroExit && proc.status !== undefined && proc.status !== 0) {
    throw new CommandFailedError(
      `Command \`${command} ${args.join(" ")}\` failed with exit code ${proc.status}`,
      proc
    );
  }

  return proc;
}

export function runPrettier(...args) {
  run(
    prettier,
    [
      ...args,
      "--config",
      ".prettierrc.json",
      "--ignore-path",
      ".prettierignore",
      "**/*.{ts,js,cjs,mjs,json,yml,yaml}",
    ],
    {
      cwd: repoRoot,
    }
  );
}

export function clearScreen() {
  process.stdout.write("\x1bc");
}

export function runWatch(watch, dir, build, options) {
  let lastStartTime;
  dir = resolve(dir);

  // We might need to wait for another watcher to create the directory.
  try {
    statSync(dir);
  } catch (err) {
    if (err.code === "ENOENT") {
      waitForDirectoryCreation();
      return;
    }
    throw err;
  }

  start();

  function waitForDirectoryCreation() {
    logWithTime(`${dir} doesn't exist yet: waiting for it to be created.`);
    watch.createMonitor(dirname(dir), "created", (monitor) => {
      monitor.on("created", (file) => {
        if (file === dir) {
          logWithTime(`${dir} created.`);
          start();
        }
      });
    });
  }

  function start() {
    // build once up-front.
    runBuild();

    watch.createMonitor(dir, { interval: 0.2, ...options }, (monitor) => {
      let handler = function (file) {
        if (lastStartTime && monitor?.files[file]?.mtime < lastStartTime) {
          // File was changed before last build started so we can ignore it. This
          // avoids running the build unnecessarily when a series of input files
          // change at the same time.
          return;
        }
        runBuild(file);
      };

      monitor.on("created", handler);
      monitor.on("changed", handler);
      monitor.on("removed", handler);
    });
  }

  function runBuild(file) {
    runBuildAsync(file).catch((err) => {
      console.error(err.stack);
      process.exit(1);
    });
  }

  async function runBuildAsync(file) {
    lastStartTime = Date.now();
    clearScreen();

    if (file) {
      logWithTime(`File change detected: ${file}. Running build.`);
    } else {
      logWithTime("Starting build in watch mode.");
    }

    try {
      await build();
      logWithTime("Build succeeded. Waiting for file changes.");
    } catch (err) {
      console.error(err.stack);
      logWithTime(`Build failed. Waiting for file changes.`);
    }
  }
}

export function logWithTime(msg) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${msg}`);
}
