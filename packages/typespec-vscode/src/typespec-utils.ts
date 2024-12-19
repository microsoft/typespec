import { readdir } from "fs";
import path, { dirname } from "path";
import vscode from "vscode";
import { StartFileName } from "./const.js";
import logger from "./log/logger.js";
import { normalizeSlashes } from "./path-utils.js";
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
  const baseDir = isFilePath ? dirname(tspPath) : tspPath;
  const mainTspFile = path.resolve(baseDir, StartFileName);
  if (await isFile(mainTspFile)) {
    return mainTspFile;
  }

  if (isFilePath && tspPath.endsWith(".tsp")) {
    return tspPath;
  }

  try {
    const files = await new Promise<string[]>((resolve, reject) => {
      readdir(baseDir, (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      });
    });
    if (files.length === 1 && files[0].endsWith(".tsp")) {
      return path.resolve(baseDir, files[0]);
    }
  } catch (error) {
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
