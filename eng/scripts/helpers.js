import { spawn, spawnSync } from "child_process";
import { statSync, readdirSync, lstatSync, readFileSync } from "fs";
import { dirname, join, resolve } from "path";
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
export const prettier = resolve(repoRoot, "packages/compiler/node_modules/.bin/prettier");
export const tsc = resolve(repoRoot, "packages/compiler/node_modules/.bin/tsc");
export const autorest = resolve(repoRoot, "eng/scripts/node_modules/.bin/autorest");

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
    if (cmd === "test-official" && !project.scripts[cmd] && project.scripts["test"]) {
      const pj = join(location, "package.json");
      throw new Error(`${pj} has a 'test' script, but no 'test-official' script for CI.`);
    }

    if (project.scripts[cmd] || cmd === "pack") {
      const args = cmd === "pack" ? [cmd] : ["run", cmd];
      run("npm", args, { cwd: location, ...options });
    }
  });
}

// We could use { shell: true } to let Windows find .cmd, but that causes other issues.
// It breaks ENOENT checking for command-not-found and also handles command/args with spaces
// poorly.
const isCmdOnWindows = ["rush", "npm", "code", "code-insiders", tsc, prettier, autorest];

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
  let lastBuildTime;
  dir = resolve(dir);

  // We need to wait for directory to be created before watching it. This deals
  // with races between watchers where one watcher must create a directory
  // before another can watch it.
  //
  // For example, we can't watch for tmlanguage.js changes if the source watcher
  // hasn't even created the directory in which tmlanguage.js will be written.
  try {
    statSync(dir);
  } catch (err) {
    if (err.code === "ENOENT") {
      waitForDirectoryCreation();
      return;
    }
    throw err;
  }

  // Directory already exists: we can start watching right away.
  start();

  function waitForDirectoryCreation() {
    let dirCreated = false;
    let parentDir = dirname(dir);
    logWithTime(`Waiting for ${dir} to be created.`);

    watch.createMonitor(parentDir, "created", (monitor) => {
      monitor.on("created", (file) => {
        if (!dirCreated && file === dir) {
          dirCreated = true; // defend against duplicate events.
          monitor.stop();
          start();
        }
      });
    });
  }

  function start() {
    // build once up-front
    runBuild();

    // then build again on any change
    watch.createMonitor(dir, { interval: 0.2, ...options }, (monitor) => {
      monitor.on("created", (file) => runBuild(`${file} created`));
      monitor.on("removed", (file) => runBuild(`${file} removed`));
      monitor.on("changed", (file) => runBuild(`${file} changed`, monitor.files[file]?.mtime));
    });
  }

  function runBuild(changeDescription, changeTime) {
    runBuildAsync(changeDescription, changeTime).catch((err) => {
      console.error(err.stack);
      process.exit(1);
    });
  }

  async function runBuildAsync(changeDescription, changeTime) {
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

export function scanSwaggers(root) {
  const files = [];
  for (const file of readdirSync(root)) {
    const fullPath = root + "/" + file;
    if (lstatSync(fullPath).isDirectory()) {
      scanSwaggers(fullPath).forEach((x) => files.push(x));
    }
    if (file === "openapi.json") {
      files.push(fullPath);
    }
  }
  return files;
}
