// @ts-check
import { readFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { run, runOrExit } from "../../packages/internal-build-utils/dist/src/index.js";

function read(filename) {
  const txt = readFileSync(filename, "utf-8")
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

const rush = read(`${repoRoot}/rush.json`);

export function forEachProject(onEach, filter) {
  // load all the projects
  for (const each of rush.projects) {
    const packageName = each.packageName;
    if (filter !== undefined && !filter.includes(packageName)) continue;
    const projectFolder = resolve(`${repoRoot}/${each.projectFolder}`);
    const project = JSON.parse(readFileSync(`${projectFolder}/package.json`, "utf-8"));
    onEach(packageName, projectFolder, project);
  }
}

export function npmForEachDependency(cmd, projectDir, options) {
  const project = JSON.parse(readFileSync(`${projectDir}/package.json`, "utf-8"));
  const deps = [
    Object.keys(project.dependencies || {}),
    Object.keys(project.devDependencies || {}),
    Object.keys(project.peerDependencies || {}),
  ].flat();

  forEachProject((name, location, project) => {
    if (project.scripts[cmd] || cmd === "pack") {
      const args = cmd === "pack" ? [cmd] : ["run", cmd];
      runOrExit("npm", args, { cwd: location, ...options });
    }
  }, deps);
}

export function npmForEach(cmd, options) {
  forEachProject((name, location, project) => {
    if (cmd === "test-official" && !project.scripts[cmd] && project.scripts["test"]) {
      const pj = join(location, "package.json");
      throw new Error(`${pj} has a 'test' script, but no 'test-official' script for CI.`);
    }

    if (project.scripts[cmd] || cmd === "pack") {
      const args = cmd === "pack" ? [cmd] : ["run", cmd];
      runOrExit("npm", args, { cwd: location, ...options });
    }
  });
}

export async function runPrettier(...args) {
  await run(
    prettier,
    [
      ...args,
      "--config",
      ".prettierrc.json",
      "--ignore-path",
      ".prettierignore",
      "**/*.{ts,js,tsx,jsx,cjs,mjs,css,json,yml,yaml,tsp,cadl,md}",
    ],
    {
      cwd: repoRoot,
    }
  );
}
