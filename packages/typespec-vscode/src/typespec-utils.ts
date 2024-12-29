import path from "path";
import vscode from "vscode";
import { StartFileName } from "./const.js";
import { getDirectoryPath, normalizeSlashes } from "./path-utils.js";
import { isFile } from "./utils.js";

export async function getEntrypointTspFile(tspPath: string): Promise<string | undefined> {
  const isFilePath = await isFile(tspPath);
  const baseDir = isFilePath ? getDirectoryPath(tspPath) : tspPath;
  const mainTspFile = path.resolve(baseDir, StartFileName);
  if (await isFile(mainTspFile)) {
    return mainTspFile;
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
