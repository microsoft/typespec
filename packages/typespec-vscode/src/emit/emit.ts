import path, { dirname } from "path";
import vscode from "vscode";
import { Executable } from "vscode-languageclient/node.js";
import logger from "../log/logger.js";
import { InstallationAction, NpmUtil } from "../npm-utils.js";
import { ExecOutput, executeCommand, isFile, resolveTypeSpecCli } from "../utils.js";
import { EmitQuickPickItem } from "./emit-quick-pick-item.js";
import { recommendedEmitters } from "./emitters.js";

export async function doEmit(
  context: vscode.ExtensionContext,
  uri: vscode.Uri,
  overallProgress: vscode.Progress<{ message?: string; increment?: number }>,
) {
  let tspProjectFolder: string = "";
  if (!uri) {
    //   const inputText = await vscode.window
    //     .showInputBox({ prompt: "Choose the tsp project folder or tsp file." })
    //     .then(async (inputText) => {
    //       if (inputText !== undefined) {
    //         const options = {
    //           canSelectMany: false,
    //           openLabel: "Select Folder",
    //           canSelectFolders: true,
    //           canSelectFiles: false,
    //         };

    //         await vscode.window.showOpenDialog(options).then((folderUris) => {
    //           inputText = folderUris ? folderUris[0].fsPath : "";
    //         });

    //         // vscode.window.showOpenDialog(options).then(folderUri => {
    //         //     if (folderUri && folderUri) {
    //         //         vscode.window.showInformationMessage(`You entered: ${inputText} and selected folder: ${folderUri.fsPath}`);
    //         //     }
    //         // });
    //       }
    //     });
    //   tspProjectFolder = inputText ?? "";
    // }
    const options = {
      canSelectMany: false,
      openLabel: "Choose tsp project Directory",
      canSelectFolders: true,
      canSelectFiles: false,
    };
    await await vscode.window.showOpenDialog(options).then((uris) => {
      tspProjectFolder = uris ? uris[0].fsPath : "";
    });
  } else {
    tspProjectFolder = uri.fsPath;
  }

  logger.info(`Select folder ${tspProjectFolder} ...`, [], {
    showOutput: true,
    showPopup: false,
    progress: overallProgress,
  });
  const baseDir = (await isFile(tspProjectFolder)) ? dirname(tspProjectFolder) : tspProjectFolder;
  /*TODO: check the main.tsp file if it is a project folder. */
  logger.info("Collecting emitters...", [], {
    showOutput: false,
    showPopup: false,
    progress: overallProgress,
  });
  const recommended: EmitQuickPickItem[] = [...recommendedEmitters];
  const toQuickPickItem = (
    language: string,
    packageName: string,
    picked: boolean,
    fromConfig: boolean,
  ): EmitQuickPickItem => {
    const found = recommended.findIndex((ke) => ke.package === packageName);
    if (found >= 0) {
      const deleted = recommended.splice(found, 1);
      deleted[0].picked = picked;
      return { ...deleted[0], ...{ picked, fromConfig } };
    } else {
      return { language: language, package: packageName, label: packageName, picked, fromConfig };
    }
  };

  /* pre-compile. */
  /*
  const emitOnlyInOptions = Object.keys(config.options ?? {})
    .filter((key) => !config.emit?.includes(key))
    .map((e) => toQuickPickItem(e, false, true));
  const emitInEmit = (config.emit ?? []).map((e: any) => toQuickPickItem(e.toString(), true, true));

  const all = [...emitInEmit, ...emitOnlyInOptions];

  if (recommended.length > 0) {
    all.push({
      package: "",
      label: "Recommended Emitters",
      kind: QuickPickItemKind.Separator,
      fromConfig: false,
    });
  }
  recommended.forEach((e) => {
    all.push(e);
  });
  */

  const all = [...recommendedEmitters].map((e) =>
    toQuickPickItem(e.language, e.package, true, false),
  );
  const selectedEmitters = await vscode.window.showQuickPick<EmitQuickPickItem>(all, {
    canPickMany: true,
    placeHolder: "Select emitters to run",
  });

  if (!selectedEmitters || selectedEmitters.length === 0) {
    logger.info("No emitters selected. Emit canceled.", [], {
      showOutput: false,
      showPopup: true,
      progress: overallProgress,
    });
    return;
  }

  /* TODO: verify the sdk runtime installation. */
  /* inform to install needed runtime. */
  const { valid, required } = await check();
  if (!valid) {
    const toInstall = required.map((e) => e.name).join(", ");
    await vscode.window
      .showInformationMessage(
        `Please install the required runtime for the selected emitters\n\n.net (>= 0.8.0) ${toInstall}`,
        "OK",
      )
      .then((selection) => {
        if (selection === "OK") {
          logger.info("Emit canceled.", [], {
            showOutput: false,
            showPopup: true,
            progress: overallProgress,
          });
        }
      });
    return;
  }

  /* config the emitter. */
  await vscode.window
    .showInformationMessage("configure the emitters in the tspConfig.yaml", "Yes", "No")
    .then(async (selection) => {
      if (selection === "Yes") {
        const document = await vscode.workspace.openTextDocument(
          path.resolve(baseDir, "tspconfig.yaml"),
        );
        vscode.window.showTextDocument(document, {
          preview: false,
          viewColumn: vscode.ViewColumn.Two,
        });
        await vscode.window
          .showInformationMessage("configure emitter.", "Completed")
          .then((selection) => {
            if (selection === "Completed") {
              vscode.commands.executeCommand("workbench.action.closeActiveEditor");
            }
          });
      } else if (selection === "No") {
      }
    });

  /*config the output dir for each selected sdk. */
  const root = vscode.Uri.joinPath(context.extensionUri, "outputDir_view");
  const panel = vscode.window.createWebviewPanel(
    "Configure output directory", // Identifies the type of the webview. Used internally
    "Configure output directory", // Title of the panel displayed to the user
    vscode.ViewColumn.Beside, // Editor column to show the new webview panel in
    {
      retainContextWhenHidden: true,
      enableScripts: true,
      localResourceRoots: [root],
    }, // Webview options. More on these later.
  );

  // And set its HTML content
  panel.webview.html = getWebviewContent(selectedEmitters);

  // Handle messages from the webview
  const outputDirs = await new Promise<{}>((resolve) => {
    panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "submitValues":
            resolve(message);
            panel.dispose();
        }
      },
      undefined,
      context.subscriptions,
    );
  });

  const outputDirsRecord: Record<string, string> = outputDirs;
  selectedEmitters.forEach((e) => (e.outputDir = outputDirsRecord[e.language]));

  /* config the output dir one by one. */
  // for (const e of selectedEmitters) {
  //   const outputDirInput = await vscode.window.showInputBox({
  //     placeHolder: `client/${e.language}`,
  //     value: `client/${e.language}`,
  //     prompt: `Please provide the output directory for ${e.language} SDK`,
  //     validateInput: (text: string) => {
  //       return text.trim() === "" ? "Input cannot be empty" : null;
  //     },
  //   });
  //   e.outputDir = outputDirInput;
  // }

  /* TODO: verify packages to install. */

  logger.info("npm install...", [], {
    showOutput: false,
    showPopup: false,
    progress: overallProgress,
  });

  const npmUtil = new NpmUtil(baseDir);

  const packagesToInstall: string[] = [];
  for (const e of selectedEmitters) {
    /* install emitter package. */
    logger.info(`select ${e.package}`);
    const { action, version } = await npmUtil.ensureNpmPackageInstall(e.package, e.version);
    /* TODO: check the dependent compiler version. */
    if (action === InstallationAction.Upgrade) {
      logger.info(`Upgrading ${e.package} to version ${version}`);
      const options = {
        ok: `OK (install ${e.package}@${version} by 'npm install'`,
        recheck: `Check again (install ${e.package} manually)`,
        ignore: `Ignore emitter ${e.label}`,
        cancel: "Cancel",
      };
      const selected = await vscode.window.showQuickPick(Object.values(options), {
        canPickMany: false,
        ignoreFocusOut: true,
        placeHolder: `Package '${e.package}' needs to be installed for emitting`,
        title: `TypeSpec Emit...`,
      });
      if (selected === options.ok) {
        packagesToInstall.push(`${e.package}@${version}`);
      }
    } else if (action === InstallationAction.Install) {
      // logger.info(`Installing ${e.package} version ${version}`, [], {
      //   showOutput: true,
      //   showPopup: true,
      //   progress: overallProgress,
      // });
      let packageFullName = e.package;
      if (e.version) {
        packageFullName = `${e.package}@${e.version}`;
      }
      logger.info(`Installing ${packageFullName}`);
      packagesToInstall.push(`${packageFullName}`);
    }
  }

  /* npm install packages. */
  if (packagesToInstall.length > 0) {
    logger.info(`Installing ${packagesToInstall.join("\n\n")}`, [], {
      showOutput: true,
      showPopup: true,
      progress: overallProgress,
    });
    try {
      const npmInstallResult = await npmUtil.npmInstallPackages(packagesToInstall);
      logger.info("completed install...");
      if (npmInstallResult.exitCode !== 0) {
        logger.error(`Error occurred when installing packages: ${npmInstallResult.stderr}`, [], {
          showOutput: true,
          showPopup: true,
          progress: overallProgress,
        });
        return;
      }
    } catch (err) {
      logger.error(`Error occurred when installing packages: ${err}`, [], {
        showOutput: true,
        showPopup: true,
        progress: overallProgress,
      });
      return;
    }
  }
  // const npmInstallResult = await npmUtil.npmInstallPackages(packagesToInstall);
  // if (npmInstallResult.exitCode !== 0) {
  //   logger.error(`Error occurred when installing packages: ${npmInstallResult.stderr}`, [], {
  //     showOutput: true,
  //     showPopup: true,
  //     progress: overallProgress,
  //   });
  //   return;
  // }

  /* emit */
  logger.info("Emit code ...", [], {
    showOutput: false,
    showPopup: false,
    progress: overallProgress,
  });
  /*TODO: resolve the start file. */
  const startFile = `${baseDir}/main.tsp`;
  const cli = await resolveTypeSpecCli(baseDir);
  if (!cli) {
    logger.error("Cannot find TypeSpec CLI. Please install @typespec/compiler. Cancel emit.", [], {
      showOutput: true,
      showPopup: true,
      progress: overallProgress,
    });
    return;
  }
  for (const e of selectedEmitters) {
    let outputDir = path.resolve(baseDir, "tsp-output", e.language);
    if (e.outputDir) {
      if (!path.isAbsolute(e.outputDir)) {
        outputDir = path.resolve(baseDir, e.outputDir);
      } else {
        outputDir = e.outputDir;
      }
    }

    const options: Record<string, string> = {};
    options["emitter-output-dir"] = outputDir;
    logger.info(`Generate Client SDK for ${e.language} ...`, [], {
      showOutput: false,
      showPopup: true,
      progress: overallProgress,
    });
    const compileResult = await compile(cli, startFile, e.package, options);
    if (compileResult.exitCode !== 0) {
      logger.error(
        `Failed to generate Client SDK for ${e.language}. error: ${compileResult.error}`,
        [],
        {
          showOutput: false,
          showPopup: true,
          progress: overallProgress,
        },
      );
    }
    logger.info(`complete generating ${e.language} SDK.`);

    /*TODO: build sdk. */
  }
}

function getWebviewContent(selectedEmitters: EmitQuickPickItem[]): string {
  let body = "";
  let script = "";
  let directories = "";
  for (const e of selectedEmitters) {
    body += `<label for="${e.language}" width="150" align="left">${e.language}:</label>
    <input type="text" id="${e.language}" name="${e.language}"><br><br>`;
    script += `const ${e.language} = document.getElementById('${e.language}').value;`;
    directories += `${e.language}: ${e.language},`;
  }

  script += `vscode.postMessage({ command: "submitValues", ${directories} });`;

  return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Configure Output Directory</title>
      </head>
      <body width="200">
          <h1>Configure output directory for each language SDK</h1>
          <form id="inputForm">
              ${body}
              <button type="button" onclick="submitValues()">Submit</button>
          </form>
          <script>
              const vscode = acquireVsCodeApi();
              function submitValues() {
                  ${script}
              }
          </script>
      </body>
      </html>
  `;
}

export async function compile(
  cli: Executable,
  startFile: string,
  emitter: string,
  options: Record<string, string>,
): Promise<ExecOutput> {
  const args: string[] = cli.args ?? [];
  args.push("compile");
  args.push(startFile);
  if (emitter) {
    args.push("--emit", emitter);
  }

  for (const [key, value] of Object.entries(options)) {
    args.push("--option", `${emitter}.${key}=${value}`);
  }

  return await executeCommand(cli.command, args, {
    cwd: dirname(startFile),
  });
}

export async function check(): Promise<{
  valid: boolean;
  required: { name: string; version: string }[];
}> {
  return { valid: true, required: [] };
}
