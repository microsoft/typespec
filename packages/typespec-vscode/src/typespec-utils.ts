import { SourceLocation } from "@typespec/compiler";
import { ServerDiagnostic } from "@typespec/compiler/internals";
import { readFile } from "fs/promises";
import path from "path";
import vscode from "vscode";
import { StartFileName } from "./const.js";
import logger from "./log/logger.js";
import { getDirectoryPath, joinPaths, normalizeSlashes } from "./path-utils.js";
import { Result, ResultCode } from "./types.js";
import { ConfirmOptions, QuickPickOptionsWithExternalLink, tryExecuteWithUi } from "./ui-utils.js";
import { isFile, loadModule, loadPackageJsonFile, spawnExecutionAndLogToOutput } from "./utils.js";

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

export function formatDiagnostic(diagnostic: ServerDiagnostic): string {
  const code = diagnostic.code ? ` ${diagnostic.code}` : "";
  const content = code ? `${code}: ${diagnostic.message}` : diagnostic.message;
  const root = diagnostic.target as SourceLocation & {
    position?: { line: number; column: number };
  };
  if (root && root.file) {
    const path = root.file.path;
    const pos = root.pos ?? 0;
    const formattedLocation = root.position
      ? `${path}:${root.position.line}:${root.position.column}`
      : `${path}:${pos}`;

    return `${formattedLocation} - ${content}`;
  } else {
    return content;
  }
}

/**
 * Install TypeSpec Compiler/CLI with UI interaction.
 *  - 'npm install -g @typespec/compiler' will be used if paths is empty or user choose "Global".
 *  - 'npm install @typespec/compiler' will be used if a local path is chosen and @typespec/compiler is not defined in package.json
 *  - 'npm install' will be used if a local path is chosen and @typespec/compiler is defined in package.json
 * @param paths: array of potential paths (or "global") to install compiler. empty array means install globally, user will be prompted to choose/confirm a path if
 *               we are going to install locally or if there are multiple choices.
 * @returns
 */
export async function installCompilerWithUi(
  confirmOptions: {
    confirmNeeded: boolean;
    confirmTitle?: string;
    confirmPlaceholder?: string;
  },
  paths: (string | "global")[],
): Promise<Result> {
  const COMPILER_REQUIREMENT =
    "Minimum Requirements: Install Node.js 20 LTS or above and verify 'node -v' and 'npm -v' run in command prompt";
  const globalPath = "global";
  if (paths.length === 0) {
    paths.push(globalPath);
  }
  const onlyGlobalInPaths = paths.length === 1 && paths[0] === globalPath;
  const locString = onlyGlobalInPaths ? "globally" : "";

  let confirmOption:
    | ConfirmOptions<QuickPickOptionsWithExternalLink, QuickPickOptionsWithExternalLink>
    | undefined = undefined;
  // confirm with end user by default
  if (confirmOptions.confirmNeeded !== false) {
    const detailLink = "https://typespec.io/docs/";
    const title = confirmOptions?.confirmTitle ?? `Install TypeSpec Compiler/CLI ${locString}`;
    const placeholder =
      confirmOptions?.confirmPlaceholder ?? "Please check the requirements and confirm...";
    confirmOption = {
      title: title,
      placeholder: placeholder,
      yesQuickPickItem: {
        label: `Install TypeSpec Compiler/CLI ${locString}`,
        detail: COMPILER_REQUIREMENT,
        description: ` by 'npm install'`,
        externalLink: detailLink,
      },
      noQuickPickItem: { label: "Cancel" },
    };
  }

  const result = await tryExecuteWithUi(
    {
      name: `Install TypeSpec Compiler/CLI ${locString}`,
      confirm: confirmOption,
      progress: {
        title: `Installing TypeSpec Compiler/CLI ${locString}...`,
        timeoutInMs: 10 * 60 * 1000,
        withCancelAndTimeout: true,
      },
    },
    async () => {
      let pathToInstall: string | undefined = paths[0];
      if (!onlyGlobalInPaths) {
        // we need to let user choose/confirm where to install the compiler
        const selectedPath = await vscode.window.showQuickPick(
          paths.map((p) => ({ label: p === globalPath ? "Global" : p, path: p })),
          {
            title: "Install TypeSpec Compiler/CLI",
            placeHolder: "Where do you want to install TypeSpec Compiler/CLI",
            canPickMany: false,
            ignoreFocusOut: true,
          },
        );
        if (selectedPath === undefined) {
          throw ResultCode.Cancelled;
        } else {
          pathToInstall = selectedPath.path;
        }
      }

      const TYPESPEC_COMPILER = "@typespec/compiler";
      const cmd = "npm";
      let cmdArgs = ["install", TYPESPEC_COMPILER];
      if (pathToInstall === globalPath) {
        cmdArgs = ["install", "-g", TYPESPEC_COMPILER];
        pathToInstall = process.cwd();
      } else {
        // if @typespec/compiler has already been defined in the package.json, let's use 'npm install' to install it which can avoid
        // potential confliction as well as unexpected modification to the package.json
        const packageJsonPath = joinPaths(pathToInstall, "package.json");
        if (await isFile(packageJsonPath)) {
          const data = await loadPackageJsonFile(packageJsonPath);
          if (
            data?.devDependencies?.[TYPESPEC_COMPILER] ||
            data?.dependencies?.[TYPESPEC_COMPILER] ||
            data?.peerDependencies?.[TYPESPEC_COMPILER]
          ) {
            logger.info(
              `${TYPESPEC_COMPILER} is already defined in package.json, run 'npm install' to install it.`,
            );
            cmdArgs = ["install"];
          }
        }
      }

      logger.debug(
        `Installing TypeSpec Compiler/CLI with command: ${cmd} ${cmdArgs.join(" ")} at ${pathToInstall}`,
      );
      await spawnExecutionAndLogToOutput(cmd, cmdArgs, pathToInstall);
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

export async function loadEmitterOptions(
  baseDir: string,
  packageName: string,
): Promise<Record<string, any> | undefined> {
  try {
    const moduleResult = await loadModule(baseDir, packageName);
    if (!moduleResult) {
      logger.debug(`Failed to resolve module ${packageName}`);
      return undefined;
    }

    const mainFilePath = moduleResult.type === "file" ? moduleResult.path : moduleResult.mainFile;
    const moduleExports = await import(vscode.Uri.file(mainFilePath).toString());
    if (moduleExports.$lib?.emitter?.options) {
      return moduleExports.$lib.emitter.options;
    }

    logger.debug(`No emitter options schema found in ${packageName}`);
    return undefined;
  } catch (error) {
    logger.debug(`Error extracting schema from ${packageName}:`, [error]);
    return undefined;
  }
}
