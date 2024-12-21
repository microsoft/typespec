import { readdir } from "node:fs/promises";
import path from "path";
import vscode from "vscode";
import { StartFileName } from "./const.js";
import logger from "./log/logger.js";
import { getDirectoryPath, normalizeSlashes } from "./path-utils.js";
import { isFile } from "./utils.js";

export const onStdioOut = (str: string) => {
  str
    .trim()
    .split("\n")
    .forEach((line) => logger.info(line));
};
export const onStdioError = (str: string) => {
  str
    .trim()
    .split("\n")
    .forEach((line) =>
      logger.error(line, [], {
        showOutput: true,
        showPopup: false,
      }),
    );
};

export async function getEntrypointTspFile(tspPath: string): Promise<string | undefined> {
  const isFilePath = await isFile(tspPath);
  const baseDir = isFilePath ? getDirectoryPath(tspPath) : tspPath;
  const mainTspFile = path.resolve(baseDir, StartFileName);
  if (await isFile(mainTspFile)) {
    return mainTspFile;
  }

  if (isFilePath && tspPath.endsWith(".tsp")) {
    return tspPath;
  }

  try {
    const files = await readdir(baseDir);
    if (files && files.length === 1 && files[0].endsWith(".tsp")) {
      return path.resolve(baseDir, files[0]);
    }
  } catch (err) {
    logger.error("Error reading directory", [err]);
    return undefined;
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
