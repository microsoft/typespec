import { readdir, rm } from "fs/promises";
import { tmpdir } from "os";
import * as semver from "semver";
import * as vscode from "vscode";
import logger from "../log/logger.js";
import { getBaseFileName, getDirectoryPath, joinPaths } from "../path-utils.js";
import telemetryClient from "../telemetry/telemetry-client.js";
import { OperationTelemetryEvent } from "../telemetry/telemetry-event.js";
import { TspLanguageClient } from "../tsp-language-client.js";
import { ResultCode } from "../types.js";
import { getEntrypointTspFile, TraverseMainTspFileInWorkspace } from "../typespec-utils.js";
import { createTempDir, throttle } from "../utils.js";

const TITLE = "Preview in OpenAPI3";

export async function showOpenApi3(
  uri: vscode.Uri,
  context: vscode.ExtensionContext,
  client: TspLanguageClient,
  tel: OperationTelemetryEvent,
): Promise<ResultCode> {
  const selectedFile = uri?.fsPath ?? vscode.window.activeTextEditor?.document.uri.fsPath;
  if (!selectedFile || !selectedFile.endsWith(".tsp")) {
    logger.error(
      "Please select a Typespec file",
      selectedFile ? [`Currently '${selectedFile}' is selected`] : [],
      {
        showOutput: true,
        showPopup: true,
      },
    );
    telemetryClient.logOperationDetailTelemetry(tel.activityId, {
      error: "Invalid file selected (not endsWith .tsp)",
    });
    tel.lastStep = "Check selected file";
    return ResultCode.Fail;
  }

  // TODO: need to support `exports`, also we should unify the logic of finding the entrypoint file
  // for both emitting codes and openapi3 preview
  const mainTspFile = (await getEntrypointTspFile(selectedFile)) ?? (await getMainTspFile());
  if (mainTspFile === undefined) {
    logger.error(`No 'main.tsp' file can be determined from '${selectedFile}' in workspace.`, [], {
      showOutput: true,
      showPopup: true,
    });
    telemetryClient.logOperationDetailTelemetry(tel.activityId, {
      error: "Can't get entrypoint tsp file",
    });
    tel.lastStep = "Get entrypoint file";
    return ResultCode.Fail;
  }

  return await loadOpenApi3PreviewPanel(mainTspFile, context, client, tel);
}

async function getMainTspFile(): Promise<string | undefined> {
  const filePath = await TraverseMainTspFileInWorkspace();

  switch (filePath.length) {
    case 0:
      logger.error("No 'main.tsp' file found in the workspace.", [], {
        showOutput: true,
        showPopup: true,
      });
      return undefined;
    case 1:
      return filePath[0];
    default:
      return await vscode.window.showQuickPick(filePath, {
        title: TITLE,
        placeHolder: "Select the 'main.tsp' file",
      });
  }
}

const openApi3TempFolders = new Map<string, string>();
const openApi3PreviewPanels = new Map<string, vscode.WebviewPanel>();
const selectedOpenApi3OutputFiles = new Map<string, string>();

async function loadOpenApi3PreviewPanel(
  mainTspFile: string,
  context: vscode.ExtensionContext,
  client: TspLanguageClient,
  tel: OperationTelemetryEvent,
): Promise<ResultCode> {
  const compilerVersion = client.initializeResult?.serverInfo?.version;
  if (!compilerVersion || semver.lt(compilerVersion, "0.65.0")) {
    logger.error("OpenAPI3 preview requires TypeSpec compiler version 0.65.0 or later.", [], {
      showOutput: true,
      showPopup: true,
    });
    telemetryClient.logOperationDetailTelemetry(tel.activityId, {
      error: "Compiler version is not supported",
      compilerVersion: compilerVersion ?? "<0.64.0",
    });
    tel.lastStep = "Check compiler version";
    return ResultCode.Fail;
  }

  const tmpRoot = tmpdir() ?? joinPaths(context.extensionPath, "swagger-ui");

  if (openApi3PreviewPanels.has(mainTspFile)) {
    // if panel is already opened, there should be a watcher to automatically update the content
    // no need to generate the openapi3 files
    const panel = openApi3PreviewPanels.get(mainTspFile)!;
    const outputFolder = await getOutputFolder(mainTspFile, tmpRoot);
    if (!outputFolder) {
      panel.dispose();
      logger.error(
        "Unexpected error. Please try again.",
        ["OpenAPI3 preview panel is available, but output folder is not."],
        {
          showOutput: true,
          showPopup: true,
        },
      );
      telemetryClient.logOperationDetailTelemetry(tel.activityId, {
        error: "Unexpected Error: Can't find output folder for preview",
      });
      tel.lastStep = "Get output folder";
      return ResultCode.Fail;
    }

    const filePath = await selectAndGetOpenApi3FilePath(mainTspFile, outputFolder, true, context);
    if (filePath === undefined) {
      tel.lastStep = "Select OpenAPI3 content";
      return ResultCode.Cancelled;
    }

    void panel.webview.postMessage({
      command: "load",
      param: panel.webview.asWebviewUri(vscode.Uri.file(filePath)).toString(),
    });
    panel.reveal();
  } else {
    const getOpenApi3OutputFilePath = async (
      selectOutput: boolean,
    ): Promise<string | undefined> => {
      return await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Loading OpenAPI3 files...",
        },
        async (): Promise<string | undefined> => {
          const srcFolder = getDirectoryPath(mainTspFile);
          const outputFolder = await getOutputFolder(mainTspFile, tmpRoot);
          if (!outputFolder) {
            logger.error("Failed to create temporary folder for OpenAPI3 files", [], {
              showOutput: true,
              showPopup: true,
            });
            return undefined;
          }
          await clearOutputFolder(outputFolder);

          const result = await client.compileOpenApi3(mainTspFile, srcFolder, outputFolder);
          if (result === undefined || result.exitCode !== 0) {
            logger.error(
              "Failed to generate OpenAPI3 files.",
              result?.stderr ? [result.stderr] : [],
            );
            return;
          } else {
            return await selectAndGetOpenApi3FilePath(
              mainTspFile,
              outputFolder,
              selectOutput,
              context,
            );
          }
        },
      );
    };

    const filePath = await getOpenApi3OutputFilePath(true);
    if (filePath === undefined) {
      telemetryClient.logOperationDetailTelemetry(tel.activityId, {
        error: "Failed to get generated OpenAPI3 file",
      });
      tel.lastStep = "Get OpenAPI3 output";
      return ResultCode.Fail;
    }

    const panel = vscode.window.createWebviewPanel(
      "webview",
      `OpenAPI3 for ${mainTspFile}`,
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      {
        retainContextWhenHidden: true,
        enableScripts: true,
        localResourceRoots: [context.extensionUri, vscode.Uri.file(tmpRoot)],
      },
    );
    openApi3PreviewPanels.set(mainTspFile, panel);

    const watch = vscode.workspace.createFileSystemWatcher("**/*.{tsp}");
    const throttledChangeHandler = throttle(async () => {
      const outputFilePath = await getOpenApi3OutputFilePath(false);
      if (outputFilePath) {
        void panel.webview.postMessage({
          command: "load",
          param: panel.webview.asWebviewUri(vscode.Uri.file(outputFilePath)).toString(),
        });
      }
    }, 1000);
    watch.onDidChange(throttledChangeHandler);
    watch.onDidCreate(throttledChangeHandler);
    watch.onDidDelete(throttledChangeHandler);

    panel.onDidDispose(() => {
      openApi3PreviewPanels.delete(mainTspFile);
      selectedOpenApi3OutputFiles.delete(mainTspFile);
      watch.dispose();
    });

    panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.event) {
        case "initialized":
          void panel.webview.postMessage({
            command: "load",
            param: panel.webview.asWebviewUri(vscode.Uri.file(filePath)).toString(),
          });
          break;
        default:
          logger.error(`Unknown WebView event received: ${message}`);
          break;
      }
    });

    loadHtml(context.extensionUri, panel);
  }
  return ResultCode.Success;
}

let html: string | undefined;

function loadHtml(extensionUri: vscode.Uri, panel: vscode.WebviewPanel) {
  if (html === undefined) {
    const distRoot = vscode.Uri.joinPath(extensionUri, "dist");
    const css = panel.webview.asWebviewUri(vscode.Uri.joinPath(distRoot, "swagger-ui.css"));
    const bundleJs = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(distRoot, "swagger-ui-bundle.js"),
    );

    const presetJs = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(distRoot, "swagger-ui-standalone-preset.js"),
    );
    // initialization script is customized to load openapi3 spec from openapi emitter output
    const initJs = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, "swagger-ui", "swagger-initializer.js"),
    );

    html = `<!doctype html>
            <html lang="en">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <link rel="stylesheet" type="text/css" href="${css}" />
                <style>.swagger-ui .info hgroup.main a {display: none;}</style>
              </head>
              <body class="no-margin-padding full-device-view" style="background-color:white">
                <div id="swagger-ui"></div>
                <script src="${bundleJs}" charset="UTF-8"> </script>
                <script src="${presetJs}" charset="UTF-8"> </script>
                <script src="${initJs}" charset="UTF-8"> </script>
              </body>
            </html>`;
  }

  panel.webview.html = html;
}

async function getOutputFolder(mainTspFile: string, tmpRoot: string): Promise<string | undefined> {
  let tmpFolder = openApi3TempFolders.get(mainTspFile);
  if (!tmpFolder) {
    tmpFolder = await createTempDir(tmpRoot, "openapi3-preview-");
    if (tmpFolder) {
      openApi3TempFolders.set(mainTspFile, tmpFolder);
    }
  }
  return tmpFolder;
}

async function clearOutputFolder(outputFolder: string) {
  let files: string[] = [];
  // Clear the contents of the existing tmpFolder
  try {
    files = await readdir(outputFolder);
  } catch (e) {
    logger.error(`Failed to read temporary folder: ${outputFolder}`, [e]);
    return;
  }
  for (const file of files) {
    try {
      await rm(joinPaths(outputFolder, file), { recursive: true, force: true });
    } catch (e) {
      logger.error(`Failed to delete file: ${file}`, [e]);
    }
  }
}

export async function clearOpenApi3PreviewTempFolders() {
  for (const folder of openApi3TempFolders.values()) {
    try {
      await rm(folder, { recursive: true, force: true });
    } catch (e) {
      logger.error(`Failed to delete temporary folder: ${folder}`, [e]);
    }
  }
}

async function selectAndGetOpenApi3FilePath(
  mainTspFile: string,
  outputFolder: string,
  selectOutput: boolean,
  context: vscode.ExtensionContext,
): Promise<string | undefined> {
  let outputs: string[] | undefined;
  try {
    outputs = await readdir(outputFolder);
  } catch (e) {
    logger.error(`Failed to read output folder: ${outputFolder}`, [e], {
      showOutput: true,
      showPopup: true,
    });
    return;
  }

  if (outputs.length === 0) {
    logger.error("No openAPI3 file generated.", [], {
      showOutput: true,
      showPopup: true,
    });
    return;
  } else if (outputs.length === 1) {
    const first = outputs[0];
    const filePath = joinPaths(outputFolder, first);
    selectedOpenApi3OutputFiles.set(mainTspFile, filePath);
    return filePath;
  } else {
    if (selectedOpenApi3OutputFiles.has(mainTspFile) && !selectOutput) {
      return selectedOpenApi3OutputFiles.get(mainTspFile);
    }
    const files = outputs.map<vscode.QuickPickItem & { path: string }>((file) => {
      const filePath = joinPaths(outputFolder, file);
      return {
        label: getBaseFileName(file),
        detail: filePath,
        path: filePath,
        iconPath: {
          light: vscode.Uri.file(context.asAbsolutePath(`./icons/openapi3.light.svg`)),
          dark: vscode.Uri.file(context.asAbsolutePath(`./icons/openapi3.dark.svg`)),
        },
      };
    });
    const selected = await vscode.window.showQuickPick(files, {
      title: TITLE,
      placeHolder: "Multiple OpenAPI3 files found. Select one to preview",
    });
    if (selected) {
      selectedOpenApi3OutputFiles.set(mainTspFile, selected.path);
      return selected.path;
    } else {
      logger.info("No OpenAPI3 file selected");
      return;
    }
  }
}
