import { readFile } from "fs/promises";
import path from "path";
import vscode from "vscode";
import { StartFileName } from "./const.js";
import logger from "./log/logger.js";
import { getDirectoryPath, normalizeSlashes } from "./path-utils.js";
import { Result, ResultCode } from "./types.js";
import { ConfirmOptions, QuickPickOptionsWithExternalLink, tryExecuteWithUi } from "./ui-utils.js";
import { isFile, spawnExecutionAndLogToOutput } from "./utils.js";

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

/**
 *
 * @param localPaths if empty, install globally. if length == 1, install to the path. if length > 1, user will be prompt to select one of the paths.
 * @returns
 */
export async function installCompilerWithUi(
  confirmOptions: {
    confirmNeeded: boolean;
    confirmTitle?: string;
    confirmPlaceholder?: string;
  },
  localPaths: string[],
): Promise<Result> {
  const COMPILER_REQUIREMENT =
    "Minimum Requirements: Install Node.js 20 LTS or above and verify 'node -v' and 'npm -v' run in command prompt";
  const isGlobal = localPaths.length === 0;

  let confirmOption:
    | ConfirmOptions<QuickPickOptionsWithExternalLink, QuickPickOptionsWithExternalLink>
    | undefined = undefined;
  // confirm with end user by default
  if (confirmOptions.confirmNeeded !== false) {
    const detailLink = "https://typespec.io/docs/";
    const title = confirmOptions?.confirmTitle ?? "Please check the requirements and confirm...";
    confirmOption = {
      title: title,
      placeholder: confirmOptions?.confirmPlaceholder ?? title,
      yesQuickPickItem: {
        label: `Install TypeSpec Compiler/CLI ${location}`,
        detail: COMPILER_REQUIREMENT,
        description: ` by 'npm install ${isGlobal ? "-g " : ""}@typespec/compiler'`,
        buttons: [
          {
            iconPath: new vscode.ThemeIcon("link-external"),
            tooltip: `Open ${detailLink}`,
          },
        ],
      },
      noQuickPickItem: { label: "Cancel" },
    };
  }

  const result = await tryExecuteWithUi(
    {
      name: `Install TypeSpec Compiler/CLI ${location}`,
      confirm: confirmOption,
      progress: {
        title: "Installing TypeSpec Compiler/CLI...",
        timeoutInMs: 10 * 60 * 1000,
        withCancelAndTimeout: true,
      },
    },
    async () => {
      let localPath: string | undefined = isGlobal ? process.cwd() : localPaths[0];
      if (localPaths.length > 1) {
        const selectedPath = await vscode.window.showQuickPick(
          localPaths.map((p) => ({ label: p, path: p })),
          {
            title: "Select the path to install TypeSpec Compiler/CLI",
            canPickMany: false,
            ignoreFocusOut: true,
          },
        );
        if (selectedPath === undefined) {
          throw ResultCode.Cancelled;
        } else {
          localPath = selectedPath.path;
        }
      }

      const cmd = "npm";
      const cmdArgs = isGlobal
        ? ["install", "-g", "@typespec/compiler"]
        : ["install", "@typespec/compiler"];
      const cwd = localPath ? localPath : localPath;
      await spawnExecutionAndLogToOutput(cmd, cmdArgs, cwd);
    },
  );

  if (result.code === ResultCode.Fail) {
    logger.warning(
      `Installing TypeSpec Compiler/CLI failed. Please make sure the pre-requisites below has been installed properly. And you may check the previous log for more detail.\n` +
        COMPILER_REQUIREMENT +
        "\n" +
        `More detail about typespec compiler: https://typespec.io/docs/\n` +
        "More detail about nodejs: https://nodejs.org/en/download/package-manager\n",
    );
  }
  return result;
}
