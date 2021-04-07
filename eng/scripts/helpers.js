import { spawn, spawnSync } from "child_process";
import { readFileSync } from "fs";
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
      console.log("Skipped: Command not found.");
    } else {
      throw proc.error;
    }
  } else if (options.throwOnNonZeroExit && proc.status !== undefined && proc.status !== 0) {
    throw new Error(`Command failed with exit code ${proc.status}`);
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
      "**/*.{ts,js,cjs,mjs,json}",
    ],
    {
      cwd: repoRoot,
    }
  );
}

export function clearScreen() {
  process.stdout.write("\x1bc");
}

export function runWatch(watch, dir, command, args, options) {
  dir = resolve(dir);
  handler();

  watch.createMonitor(dir, (monitor) => {
    monitor.on("created", handler);
    monitor.on("changed", handler);
    monitor.on("removed", handler);
  });

  function handler(file) {
    if (file && options.filter && !options.filter(file)) {
      return;
    }

    clearScreen();
    logWithTime(`File changes detected in ${dir}. Running build.`);
    const proc = run(command, args, { throwOnNonZeroExit: false, ...options });
    console.log();
    if (proc.status === 0) {
      logWithTime("Build succeeded. Waiting for file changes...");
    } else {
      logWithTime(`Build failed with exit code ${proc.status}. Waiting for file changes...`);
    }
  }
}

export function logWithTime(msg) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${msg}`);
}
