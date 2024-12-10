import { readdir } from "fs";
import path, { dirname } from "path";
import { Executable } from "vscode-languageclient/node.js";
import logger from "./log/logger.js";
import { isFile, loadModule } from "./utils.js";

export const toOutput = (str: string) => {
  str
    .trim()
    .split("\n")
    .forEach((line) => logger.info(line));
};
export const toError = (str: string) => {
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

export async function resolveTypeSpecCli(absolutePath: string): Promise<Executable | undefined> {
  if (!path.isAbsolute(absolutePath) || (await isFile(absolutePath))) {
    return undefined;
  }
  const modelInfo = await loadModule(absolutePath, "@typespec/compiler");
  if (modelInfo) {
    //const cli = modelInfo.executables.find((exe) => exe.name === "tsp");
    const cmdPath = path.resolve(modelInfo.path, "cmd/tsp.js");
    return {
      command: "node",
      args: [cmdPath],
    };
  }
  return undefined;
}

export async function getMainTspFile(tspPath: string): Promise<string | undefined> {
  const isFilePath = await isFile(tspPath);
  const baseDir = isFilePath ? dirname(tspPath) : tspPath;
  const mainTspFile = path.resolve(baseDir, "main.tsp");
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
