import { readdir, readFile } from "fs/promises";
import { dirname, join } from "path";
import * as vscode from "vscode";
import logger from "./log/logger.js";
import { TspLanguageClient } from "./tsp-language-client.js";
import { createTempDir } from "./utils.js";

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

const openApi3TmpFolders = new Map<string, string>();
const openApi3PreviewPanels = new Map<string, vscode.WebviewPanel>();

export function loadOpenApi3PreviewPanel(
  mainTspFile: string,
  extensionUri: vscode.Uri,
  client: TspLanguageClient,
) {
  if (openApi3PreviewPanels.has(mainTspFile)) {
    openApi3PreviewPanels.get(mainTspFile)!.reveal();
  } else {
    const panel = vscode.window.createWebviewPanel(
      "webview",
      `OpenAPI3 for ${mainTspFile}`,
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: true },
      {
        retainContextWhenHidden: true,
        enableScripts: true,
        localResourceRoots: [extensionUri],
      },
    );

    const loadHandler = async (uri?: vscode.Uri) => {
      console.log("Load handler called: " + uri);
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Loading OpenAPI3 files...",
        },
        async () => {
          const srcFolder = dirname(mainTspFile);
          const outputFolder = join(srcFolder, "tsp-output","@typespec", "openapi3");
          const result = await client.compileOpenApi3(mainTspFile, srcFolder);
          if (result === undefined || result.exitCode !== 0) {
            const errMsg = result?.stderr ?? "Failed to generate openAPI3 files.";
            logger.error(errMsg);
            vscode.window.showErrorMessage(errMsg);
          } else {
            const outputs = await readdir(outputFolder);
            if (outputs.length === 0) {
              const errMsg = result?.stderr ?? "No openAPI3 file generated.";
              logger.error(errMsg);
              vscode.window.showErrorMessage(errMsg);
            } else {
              const first = outputs[0];
              try {
                const fileContent = await readFile(join(outputFolder, first), "utf-8");
                const content = JSON.parse(fileContent);
                void panel.webview.postMessage({ command: "load", param: content });
              } catch (e) {
                const errMsg = `Failed to load OpenAPI3 file: ${first}`;
                logger.error(`${errMsg}\nError: `, [e]);
                vscode.window.showErrorMessage(errMsg);
              }
            }
          }
        },
      );
    };

    panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.event) {
        case "initialized":
          await loadHandler();
          break;
        default:
          logger.error(`Unknown WebView event received: ${message}`);
          break;
      }
    });

    const watch = vscode.workspace.createFileSystemWatcher("**/*.{tsp}");
    const debouncedLoadHandler = throttle(loadHandler, 1000);
    // const debouncedLoadHandler = loadHandler;
    // watch.onDidChange(debounce(() => { vscode.window.showErrorMessage("aaa"); }, 500));
    // watch.onDidChange(async () => { await debouncedLoadHandler();});
    // watch.onDidChange(async (e) => { await debouncedLoadHandler(e);});
    watch.onDidChange(debouncedLoadHandler);
    watch.onDidCreate(debouncedLoadHandler);
    watch.onDidDelete(debouncedLoadHandler);

    openApi3PreviewPanels.set(mainTspFile, panel);
    panel.onDidDispose(() => {
      openApi3PreviewPanels.delete(mainTspFile);
      watch.dispose();
    });

    loadHtml(extensionUri, panel);
  }
}

let html: string | undefined;

function loadHtml(extensionUri: vscode.Uri, panel: vscode.WebviewPanel) {
  if (html === undefined) {
    const swaggerUiRoot = vscode.Uri.joinPath(extensionUri, "node_modules", "swagger-ui-dist");
    const css = panel.webview.asWebviewUri(vscode.Uri.joinPath(swaggerUiRoot, "swagger-ui.css"));
    const bundleJs = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(swaggerUiRoot, "swagger-ui-bundle.js"),
    );

    const presetJs = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(swaggerUiRoot, "swagger-ui-standalone-preset.js"),
    );
    // initialization script is customized to load openapi3 spec from openapi emitter output
    const initJs = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, "openapi3_view", "swagger-initializer.js"),
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

function debounce<T extends (...args: any[]) => any>(fn: T, delayInMs: number): T {
  let timer: NodeJS.Timeout | undefined;
  return function (this: any, ...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delayInMs);
  } as T;
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

function debounceAsync<T extends (...args: any[]) => Promise<any>>(func: T, wait: number): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | undefined;
  return function(this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve, reject) => {
      if (timeout) {
        console.log(`Clearing timeout: ${timeout}`);
        clearTimeout(timeout);
      }
      console.log("Setting timeout");
      timeout = setTimeout(async () => {
        try {
          console.log(`Running timeout: ${timeout}`);
          const result = await func.apply(this, args);
          resolve(result);
          console.log(`Finish timeout: ${timeout}`);
        } catch (error) {
          reject(error);
        }
      }, wait);
      console.log(`Timeout set: ${timeout});`);
    });
  };
}
