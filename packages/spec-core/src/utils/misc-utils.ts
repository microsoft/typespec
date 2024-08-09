import { execSync } from "child_process";
import { readFile, stat } from "fs/promises";
import { dirname, join } from "path";
import { logger } from "../logger.js";

export async function ensureScenariosPathExists(scenariosPath: string) {
  try {
    const stats = await stat(scenariosPath);
    if (!stats.isDirectory()) {
      throw new Error(`Scenarios path ${scenariosPath} is not a directory.`);
    }
  } catch (e) {
    throw new Error(`Scenarios path ${scenariosPath} doesn't exists.`);
  }
}

export function getCommit(path: string): string {
  return execSync("git rev-parse HEAD", { cwd: path }).toString().trim();
}

export interface PackageJson {
  name: string;
  version: string;
}

export async function getPackageJson(path: string): Promise<PackageJson | undefined> {
  logger.debug(`Loading package json for path "${path}"`);
  const projectRoot = await findProjectRoot(path);
  if (projectRoot === undefined) {
    return undefined;
  }
  logger.debug(`Found project root "${projectRoot}"`);
  const packageJsonPath = join(projectRoot, "package.json");
  return JSON.parse((await readFile(packageJsonPath, "utf-8")).toString());
}

async function findProjectRoot(path: string): Promise<string | undefined> {
  let current = path;
  while (true) {
    const pkgPath = join(current, "package.json");
    try {
      const stats = await stat(pkgPath);
      if (stats?.isFile()) {
        return current;
      }
    } catch {}

    const parent = dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}
