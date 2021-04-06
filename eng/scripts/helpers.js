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
  } else if (proc.status !== undefined && proc.status !== 0) {
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

export function watchHandler(cb) {
  clearScreen();
  console.log("@@BEGIN");
  try {
    cb();
  } catch (err) {
    console.log(err.stack);
    console.log("@@END");
    process.exit(1);
  }
  console.log("@@END");
}
