import { readdir, rm } from "fs/promises";
import * as semver from "semver";
import * as vscode from "vscode";
import logger from "../log/logger.js";
import { getBaseFileName, getDirectoryPath, joinPaths } from "../path-utils.js";
import { TspLanguageClient } from "../tsp-language-client.js";
import { TraverseMainTspFileInWorkspace } from "../typespec-utils.js";
import { createTempDir, parseJsonFromFile, throttle } from "../utils.js";

const TITLE = "Preview in OpenAPI3";

export async function showOpenApi3(
  uri: vscode.Uri,
  context: vscode.ExtensionContext,
  client: TspLanguageClient,
) {
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
    return;
  }

  const mainTspFile = selectedFile.endsWith("main.tsp") ? selectedFile : await getMainTspFile();
  if (mainTspFile === undefined) {
    logger.error(`No 'main.tsp' file can be determined from '${selectedFile}' in workspace.`, [], {
      showOutput: true,
      showPopup: true,
    });
    return;
  }

  await loadOpenApi3PreviewPanel(mainTspFile, context, client);
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
) {
  const compilerVersion = client.initializeResult?.serverInfo?.version;
  if (!compilerVersion || semver.lt(compilerVersion, "0.65.0")) {
    logger.error("OpenAPI3 preview requires TypeSpec compiler version 0.65.0 or later.", [], {
      showOutput: true,
      showPopup: true,
    });
    return;
  }

  if (openApi3PreviewPanels.has(mainTspFile)) {
    // if panel is already opened, there should be a watcher to automatically update the content
    // no need to generate the openapi3 files
    const panel = openApi3PreviewPanels.get(mainTspFile)!;
    const outputFolder = await getOutputFolder(mainTspFile);
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
      return;
    }

    const fileContent = await selectAndGetOpenApi3Content(mainTspFile, outputFolder, true, context);
    if (fileContent === undefined) {
      return;
    }

    void panel.webview.postMessage({ command: "load", param: fileContent });
    panel.reveal();
  } else {
    const getOpenApi3Output = async (selectOutput: boolean): Promise<string | undefined> => {
      return await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Loading OpenAPI3 files...",
        },
        async (): Promise<string | undefined> => {
          const srcFolder = getDirectoryPath(mainTspFile);
          const outputFolder = await getOutputFolder(mainTspFile);
          if (!outputFolder) {
            logger.error("Failed to create temporary folder for OpenAPI3 files", [], {
              showOutput: true,
              showPopup: true,
            });
            return undefined;
          }

          const result = await client.compileOpenApi3(mainTspFile, srcFolder, outputFolder);
          if (result === undefined || result.exitCode !== 0) {
            logger.error(
              "Failed to generate OpenAPI3 files.",
              result?.stderr ? [result.stderr] : [],
            );
            return;
          } else {
            return await selectAndGetOpenApi3Content(
              mainTspFile,
              outputFolder,
              selectOutput,
              context,
            );
          }
        },
      );
    };

    const fileContent = await getOpenApi3Output(true);
    if (fileContent === undefined) {
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "webview",
      `OpenAPI3 for ${mainTspFile}`,
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      {
        retainContextWhenHidden: true,
        enableScripts: true,
        localResourceRoots: [context.extensionUri],
      },
    );
    openApi3PreviewPanels.set(mainTspFile, panel);

    const watch = vscode.workspace.createFileSystemWatcher("**/*.{tsp}");
    const throttledChangeHandler = throttle(async () => {
      const content = await getOpenApi3Output(false);
      void panel.webview.postMessage({ command: "load", param: content });
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
          void panel.webview.postMessage({ command: "load", param: fileContent });
          break;
        default:
          logger.error(`Unknown WebView event received: ${message}`);
          break;
      }
    });

    loadHtml(context.extensionUri, panel);
  }
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

async function getOutputFolder(mainTspFile: string): Promise<string | undefined> {
  let tmpFolder = openApi3TempFolders.get(mainTspFile);
  if (!tmpFolder) {
    tmpFolder = await createTempDir();
    if (tmpFolder) {
      openApi3TempFolders.set(mainTspFile, tmpFolder);
    }
  }
  return tmpFolder;
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

async function selectAndGetOpenApi3Content(
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
    return parseOpenApi3File(filePath);
  } else {
    if (selectedOpenApi3OutputFiles.has(mainTspFile) && !selectOutput) {
      return parseOpenApi3File(selectedOpenApi3OutputFiles.get(mainTspFile)!);
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
      return parseOpenApi3File(selected.path);
    } else {
      logger.info("No OpenAPI3 file selected");
      return;
    }
  }
}

async function parseOpenApi3File(filePath: string): Promise<string | undefined> {
  const json = await parseJsonFromFile(filePath);
  if (json) {
    return json;
  }

  logger.error(`Failed to load OpenAPI3 file: ${filePath}`, [], {
    showOutput: true,
    showPopup: true,
  });
  return;
}
