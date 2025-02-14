import { readdir, readFile, rm } from "fs/promises";
import { basename, dirname, join } from "path";
import * as semver from "semver";
import * as vscode from "vscode";
import logger from "./log/logger.js";
import { TspLanguageClient } from "./tsp-language-client.js";
import { createTempDir, ExecOutput } from "./utils.js";

export async function getMainTspFile(): Promise<string | undefined> {
  const files = await vscode.workspace.findFiles("**/main.tsp").then((uris) => {
    return uris.filter((uri) => uri.scheme === "file" && !uri.fsPath.includes("node_modules"));
  });

  switch (files.length) {
    case 0:
      const errMsg = "No 'main.tsp' file found in the workspace.";
      logger.error(errMsg);
      vscode.window.showErrorMessage(errMsg);
      return undefined;
    case 1:
      return files[0].fsPath;
    default:
      return await vscode.window.showQuickPick(
        files.map((file) => file.fsPath),
        {
          title: "Select the 'main.tsp' file",
        },
      );
  }
}

const openApi3TempFolders = new Map<string, string>();
const openApi3PreviewPanels = new Map<string, vscode.WebviewPanel>();
const selectedOpenApi3OutputFiles = new Map<string, string>();

export async function loadOpenApi3PreviewPanel(
  mainTspFile: string,
  context: vscode.ExtensionContext,
  client: TspLanguageClient,
) {
  const compilerVersion = client.initializeResult?.serverInfo?.version;
  if (!compilerVersion || semver.lt(compilerVersion, "0.65.0")) {
    const errMsg = "OpenAPI3 preview requires TypeSpec compiler version 0.65.0 or later.";
    logger.info(errMsg);
    vscode.window.showErrorMessage(errMsg);
    return;
  }

  if (openApi3PreviewPanels.has(mainTspFile)) {
    openApi3PreviewPanels.get(mainTspFile)!.reveal();
  } else {
    const getOpenApi3Output = async (uri?: vscode.Uri): Promise<string | undefined> => {
      return await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Loading OpenAPI3 files...",
        },
        async (): Promise<string | undefined> => {
          const srcFolder = dirname(mainTspFile);
          const outputFolder = await getOutputFolder(mainTspFile);
          let result: ExecOutput | undefined;
          try {
            result = await client.compileOpenApi3(mainTspFile, srcFolder, outputFolder);
          } catch (e) {
            const error = e as ExecOutput;
            const errMsg = `Failed to generate OpenAPI3 files: ${error.stderr || error.stdout || error.error}`;
            logger.error(errMsg);
            vscode.window.showErrorMessage(errMsg);
            return;
          }
          if (result === undefined || result.exitCode !== 0) {
            const errMsg = result?.stderr ?? "Failed to generate OpenAPI3 files.";
            logger.error(errMsg);
            vscode.window.showErrorMessage(errMsg);
            return;
          } else {
            const outputs = await readdir(outputFolder);
            if (outputs.length === 0) {
              const errMsg = result?.stderr ?? "No openAPI3 file generated.";
              logger.error(errMsg);
              vscode.window.showErrorMessage(errMsg);
              return;
            } else if (outputs.length === 1) {
              const first = outputs[0];
              return parseOpenApi3File(join(outputFolder, first));
            } else {
              if (selectedOpenApi3OutputFiles.has(mainTspFile)) {
                return parseOpenApi3File(selectedOpenApi3OutputFiles.get(mainTspFile)!);
              }

              const files = outputs.map<vscode.QuickPickItem & { path: string }>((file) => {
                const filePath = join(outputFolder, file);
                return {
                  label: basename(file),
                  detail: filePath,
                  path: filePath,
                  iconPath: {
                    light: vscode.Uri.file(context.asAbsolutePath(`./icons/openapi3.light.svg`)),
                    dark: vscode.Uri.file(context.asAbsolutePath(`./icons/openapi3.dark.svg`)),
                  },
                };
              });
              const selected = await vscode.window.showQuickPick(files, {
                title: "Multiple OpenAPI3 files found. Select one to preview",
                placeHolder: "Select an OpenAPI3 file",
              });
              if (selected) {
                selectedOpenApi3OutputFiles.set(mainTspFile, selected.path);
                return parseOpenApi3File(selected.path);
              } else {
                const msg = "No OpenAPI3 file selected";
                logger.info(msg);
                vscode.window.showInformationMessage(msg);
                return;
              }
            }
          }
        },
      );
    };

    const fileContent = await getOpenApi3Output();
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
      const content = await getOpenApi3Output();
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
    const swaggerUiRoot = vscode.Uri.joinPath(extensionUri, "swagger-ui");
    const css = panel.webview.asWebviewUri(vscode.Uri.joinPath(swaggerUiRoot, "swagger-ui.css"));
    const bundleJs = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(swaggerUiRoot, "swagger-ui-bundle.js"),
    );

    const presetJs = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(swaggerUiRoot, "swagger-ui-standalone-preset.js"),
    );
    // initialization script is customized to load openapi3 spec from openapi emitter output
    const initJs = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(swaggerUiRoot, "swagger-initializer.js"),
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

/**
 * Throttle the function to be called at most once in every blockInMs milliseconds. This utility
 * is useful when your event handler will trigger the same event multiple times in a short period.
 *
 * @param fn Underlying function to be throttled
 * @param blockInMs Block time in milliseconds
 * @returns a throttled function
 */
function throttle<T extends (...args: any[]) => any>(fn: T, blockInMs: number): T {
  let time: number | undefined;
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    if (time === undefined || now - time >= blockInMs) {
      time = now;
      fn.apply(this, args);
    }
  } as T;
}

async function parseOpenApi3File(filePath: string): Promise<string | undefined> {
  try {
    const fileContent = await readFile(filePath, "utf-8");
    const content = JSON.parse(fileContent);
    return content;
  } catch (e) {
    const errMsg = `Failed to load OpenAPI3 file: ${filePath}`;
    logger.error(`${errMsg}\nError: `, [e]);
    vscode.window.showErrorMessage(errMsg);
    return;
  }
}

async function getOutputFolder(mainTspFile: string): Promise<string> {
  let tmpFolder = openApi3TempFolders.get(mainTspFile);
  if (!tmpFolder) {
    tmpFolder = await createTempDir();
    openApi3TempFolders.set(mainTspFile, tmpFolder);
  }
  return tmpFolder;
}

export async function clearOpenApi3PreviewTempFolders() {
  for (const folder of openApi3TempFolders.values()) {
    await rm(folder, { recursive: true, force: true });
  }
}
