import { readFile } from "fs/promises";
import path from "path";
import vscode from "vscode";
import { StartFileName } from "./const.js";
import logger from "./log/logger.js";
import { getDirectoryPath, normalizeSlashes } from "./path-utils.js";
import { isFile } from "./utils.js";

export async function getEntrypointTspFile(tspPath: string): Promise<string | undefined> {
  const isFilePath = await isFile(tspPath);
  let baseDir = isFilePath ? getDirectoryPath(tspPath) : tspPath;

  while (true) {
    const entrypointTspFile = await getEntrypointTspFileInFolder(baseDir);
    if (entrypointTspFile) {
      return entrypointTspFile;
    }
    const parentDir = getDirectoryPath(baseDir);
    if (parentDir === baseDir) {
      break;
    }
    baseDir = parentDir;
  }

  /* if there is no defined main entry point tsp file, return the selected tsp file. */
  if (isFilePath) return tspPath;

  return undefined;
}

export async function TraverseMainTspFileInWorkspace() {
  return vscode.workspace
    .findFiles(`**/${StartFileName}`, "**/node_modules/**")
    .then((uris) =>
      uris
        .filter((uri) => uri.scheme === "file" && !uri.fsPath.includes("node_modules"))
        .map((uri) => normalizeSlashes(uri.fsPath)),
    );
}

export async function TraverseEntrypointTspFileInWorkspace(): Promise<string[]> {
  const targetFolders = await vscode.workspace
    .findFiles(`**/${StartFileName}`, "**/node_modules/**")
    .then((uris) => {
      const directories = new Set<string>();
      uris
        .filter((uri) => uri.scheme === "file" && !uri.fsPath.includes("node_modules"))
        .map((uri) => directories.add(getDirectoryPath(normalizeSlashes(uri.fsPath))));
      return Array.from(directories);
    });
  const entrypointTspFiles: string[] = [];

  for (const folder of targetFolders) {
    while (true) {
      const entrypointTspFile = await getEntrypointTspFileInFolder(folder);
      if (entrypointTspFile) {
        entrypointTspFiles.push(entrypointTspFile);
      }
    }
  }

  return entrypointTspFiles;
}

async function getEntrypointTspFileInFolder(folder: string): Promise<string | undefined> {
  if (await isFile(folder)) return undefined;
  const pkgPath = path.resolve(folder, "package.json");
  if (await isFile(pkgPath)) {
    /* get the tspMain from package.json. */
    try {
      const data = await readFile(pkgPath, { encoding: "utf-8" });
      const packageJson = JSON.parse(data);
      const tspMain = packageJson.tspMain;
      if (typeof tspMain === "string") {
        const tspMainFile = path.resolve(folder, tspMain);
        if (await isFile(tspMainFile)) {
          logger.debug(`tspMain file ${tspMainFile} selected as entrypoint file.`);
          return tspMainFile;
        }
      }
    } catch (error) {
      logger.error(`An error occurred while reading the package.json file ${pkgPath}`, [error]);
    }
  }

  const mainTspFile = path.resolve(folder, StartFileName);
  if (await isFile(mainTspFile)) {
    return mainTspFile;
  }

  return undefined;
}
