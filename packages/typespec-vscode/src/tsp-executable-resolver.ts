import { dirname, isAbsolute, join } from "path";
import { ExtensionContext, workspace } from "vscode";
import { Executable, ExecutableOptions } from "vscode-languageclient/node.js";
import logger from "./log/logger.js";
import { getDirectoryPath } from "./path-utils.js";
import telemetryClient from "./telemetry/telemetry-client.js";
import { SettingName } from "./types.js";
import { checkInstalledNode, isFile, loadModule, useShellInExec } from "./utils.js";
import { VSCodeVariableResolver } from "./vscode-variable-resolver.js";

/**
 *
 * @param absoluteTargetPath the path is expected to be absolute path and no further expanding or resolving needed.
 * @returns
 */
export async function resolveTypeSpecCli(
  absoluteTargetPath: string,
): Promise<Executable | undefined> {
  if (!isAbsolute(absoluteTargetPath)) {
    logger.error(`Expect absolute path for resolving cli, but got ${absoluteTargetPath}`);
    return undefined;
  }

  const options: ExecutableOptions = {
    env: { ...process.env },
  };

  const baseDir = (await isFile(absoluteTargetPath))
    ? dirname(absoluteTargetPath)
    : absoluteTargetPath;

  const compilerPath = await resolveLocalCompiler(baseDir);
  if (!compilerPath || compilerPath.length === 0) {
    const executable = process.platform === "win32" ? `tsp.cmd` : "tsp";
    logger.debug(
      `Can't resolve compiler path for tsp task, try to use default value ${executable}.`,
    );
    return useShellInExec({ command: executable, args: [], options });
  } else {
    logger.debug(`Compiler path resolved as: ${compilerPath}`);
    const jsPath = join(compilerPath, "cmd/tsp.js");
    options.env["TYPESPEC_SKIP_COMPILER_RESOLVE"] = "1";
    return { command: "node", args: [jsPath], options };
  }
}

export async function resolveTypeSpecServer(
  activityId: string,
  context: ExtensionContext,
): Promise<Executable> {
  const checkNodePromise = checkInstalledNode();
  const nodeOptions = process.env.TYPESPEC_SERVER_NODE_OPTIONS;
  const args = ["--stdio"];
  let compilerLocation: string | undefined;

  // In development mode (F5 launch from source), resolve to locally built server.js.
  if (process.env.TYPESPEC_DEVELOPMENT_MODE) {
    const script = context.asAbsolutePath("../compiler/entrypoints/server.js");
    // we use CLI instead of NODE_OPTIONS environment variable in this case
    // because --nolazy is not supported by NODE_OPTIONS.
    const options = nodeOptions?.split(" ").filter((o) => o) ?? [];
    logger.debug("TypeSpec server resolved in development mode");
    return { command: "node", args: [...options, script, ...args] };
  }

  const options: ExecutableOptions = {
    env: { ...process.env },
  };
  if (nodeOptions) {
    options.env.NODE_OPTIONS = nodeOptions;
  }

  // In production, first try VS Code extension configuration, which allows a global machine
  // location that is not on PATH, or a workspace-specific installation.
  let serverPath: string | undefined = workspace.getConfiguration().get(SettingName.TspServerPath);
  if (serverPath && typeof serverPath !== "string") {
    throw new Error(`VS Code configuration option '${SettingName.TspServerPath}' must be a string`);
  }
  const workspaceFolder = workspace.workspaceFolders?.[0]?.uri?.fsPath ?? "";

  // Default to tsp-server on PATH, which would come from `npm install -g
  // @typespec/compiler` in a vanilla setup.
  if (serverPath) {
    logger.info(`Server path loaded from TypeSpec extension configuration: ${serverPath}`);
    compilerLocation = "compiler-configured-by-setting";
  } else {
    logger.info(
      "Server path not configured in TypeSpec extension configuration, trying to resolve locally within current workspace.",
    );
    serverPath = await resolveLocalCompilerInWorkspaces();
  }

  if (!serverPath) {
    const executable = process.platform === "win32" ? "tsp-server.cmd" : "tsp-server";
    logger.warning(
      `Can't resolve server path from either TypeSpec extension configuration or workspace, try to use default value ${executable}.`,
    );
    telemetryClient.logOperationDetailTelemetry(activityId, {
      compilerLocation: "global-compiler",
    });
    return useShellInExec({ command: executable, args, options });
  }
  compilerLocation ??= "local-compiler";
  telemetryClient.logOperationDetailTelemetry(activityId, { compilerLocation });
  const variableResolver = new VSCodeVariableResolver({
    workspaceFolder,
    workspaceRoot: workspaceFolder, // workspaceRoot is deprecated but we still support it for backwards compatibility.
  });

  serverPath = variableResolver.resolve(serverPath);
  logger.debug(`Server path expanded to: ${serverPath}`);

  if (!serverPath.endsWith(".js")) {
    // Allow path to tsp-server.cmd to be passed.
    if (await isFile(serverPath)) {
      const command =
        process.platform === "win32" && !serverPath.endsWith(".cmd")
          ? `${serverPath}.cmd`
          : serverPath;

      return useShellInExec({ command, args, options });
    } else {
      serverPath = join(serverPath, "cmd/tsp-server.js");
    }
  }

  options.env["TYPESPEC_SKIP_COMPILER_RESOLVE"] = "1";
  const nodeInstallPath = await checkNodePromise;
  if (nodeInstallPath.length > 0) {
    logger.debug(`Start tsp server using node at ${nodeInstallPath}`);
    return { command: "node", args: [serverPath, ...args], options };
  } else {
    // otherwise the local compiler should be installed by standalone tsp cli
    logger.debug("Start tsp server using standalone tsp cli");
    return { command: "tsp", args: ["--server", serverPath, ...args], options };
  }
}

async function resolveLocalCompilerInWorkspaces(): Promise<string | undefined> {
  try {
    if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
      return undefined;
    }
    const FIRST_WORKSPACE_INDEX = 0;
    const SECOND_WORKSPACE_INDEX = 1;
    // Try to resolve compiler from the first workspace folder directly which should work in most cases
    const firstWorkspaceFolder = workspace.workspaceFolders[FIRST_WORKSPACE_INDEX].uri.fsPath;
    const path = await resolveLocalCompiler(firstWorkspaceFolder);
    if (path) {
      return path;
    }
    // Fallback to search the whole workspaces which will trigger more heavy operations
    const folders = (await workspace.findFiles("**/package.json", "**/node_modules/**")).map(
      (uri) => getDirectoryPath(uri.fsPath),
    );
    const otherWorkspaceFolder = workspace.workspaceFolders
      .slice(SECOND_WORKSPACE_INDEX)
      .map((wf) => wf.uri.fsPath);
    folders.push(...otherWorkspaceFolder);
    const uniqueFolders = new Set(folders);

    for (const folder of uniqueFolders) {
      logger.debug(`Try to resolve compiler from folder: ${folder}`);
      const path = await resolveLocalCompiler(folder);
      if (path) {
        return path;
      }
    }
    return undefined;
  } catch (e) {
    logger.debug("Exception when resolving compiler from workspaces", [e]);
    return undefined;
  }
}

async function resolveLocalCompiler(baseDir: string): Promise<string | undefined> {
  try {
    const executable = await loadModule(baseDir, "@typespec/compiler");
    if (!executable) {
      return undefined;
    }
    if (executable.type === "module") {
      logger.debug(`Resolved compiler from local: ${executable.path}`);
      return executable.path;
    } else {
      logger.debug(
        `Failed to resolve compiler from local '${baseDir}'. Unexpected executable type: ${executable.type}`,
      );
    }
  } catch (e) {
    // Couldn't find the module
    logger.debug(`Exception when resolving compiler from local '${baseDir}'`, [e]);
    return undefined;
  }
  return undefined;
}
