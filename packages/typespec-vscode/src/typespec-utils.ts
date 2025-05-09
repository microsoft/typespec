import { Diagnostic, SourceLocation } from "@typespec/compiler";
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

export function getVscodeUriFromPath(path: string) {
  const uri = vscode.Uri.file(path);
  return uri.toString();
}

export function formatDiagnostic(diagnostic: Diagnostic): string {
  const code = diagnostic.code ? ` ${diagnostic.code}` : "";
  const content = code ? `${code}: ${diagnostic.message}` : diagnostic.message;
  const root = diagnostic.target as SourceLocation;
  if (root && root.file) {
    const path = root.file.path;
    const pos = root.pos ?? 0;
    const formattedLocation = `${path}:${pos}`;
    const message = [`${formattedLocation} - ${content}`];

    return message.join("\n");
  } else {
    return content;
  }
}
