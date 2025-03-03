import { readFile } from "fs/promises";
import path from "path";
import vscode from "vscode";
import which from "which";
import { StartFileName } from "./const.js";
import logger from "./log/logger.js";
import { getDirectoryPath, normalizeSlashes } from "./path-utils.js";
import { isFile } from "./utils.js";

export async function getEntrypointTspFile(tspPath: string): Promise<string | undefined> {
  const isFilePath = await isFile(tspPath);
  let baseDir = isFilePath ? getDirectoryPath(tspPath) : tspPath;

  while (true) {
    const pkgPath = path.resolve(baseDir, "package.json");
    if (await isFile(pkgPath)) {
      /* get the tspMain from package.json. */
      try {
        const data = await readFile(pkgPath, { encoding: "utf-8" });
        const packageJson = JSON.parse(data);
        const tspMain = packageJson.tspMain;
        if (typeof tspMain === "string") {
          const tspMainFile = path.resolve(baseDir, tspMain);
          if (await isFile(tspMainFile)) {
            logger.debug(`tspMain file ${tspMainFile} selected as entrypoint file.`);
            return tspMainFile;
          }
        }
      } catch (error) {
        logger.error(`An error occurred while reading the package.json file ${pkgPath}`, [error]);
      }
    }

    const mainTspFile = path.resolve(baseDir, StartFileName);
    if (await isFile(mainTspFile)) {
      return mainTspFile;
    }
    const parentDir = getDirectoryPath(baseDir);
    if (parentDir === baseDir) {
      break;
    }
    baseDir = parentDir;
  }

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

type TspCliType = "tsp-npm-global" | "tsp-standalone" | "not-available";
export async function checkTspCliType(): Promise<TspCliType> {
  try {
    // using "which" instead of 'tsp --version' to do the check because 'tsp --version' is very slow
    const found = await which("tsp");
    // the standalone tsp is expected to be installed at .../.tsp/... folder
    const isStandalone = found.length > 0 && found.includes(".tsp");
    return isStandalone ? "tsp-standalone" : "tsp-npm-global";
  } catch (e) {
    return "not-available";
  }
}
