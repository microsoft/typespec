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

  const selectedEmitter = await vscode.window.showQuickPick<EmitQuickPickItem>(all, {
    title: "Select a Language",
    canPickMany: false,
    placeHolder: "Pick a Language",
  });

  if (!selectedEmitter) {
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

  /* config the output dir. */
  const outputDirInput = await vscode.window.showInputBox({
    placeHolder: `client/${selectedEmitter.language}`,
    value: `client/${selectedEmitter.language}`,
    prompt: `Please provide the output directory for ${selectedEmitter.language} SDK`,
    validateInput: (text: string) => {
      return text.trim() === "" ? "Input cannot be empty" : null;
    },
  });
  selectedEmitter.outputDir = outputDirInput;

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
  /* install emitter package. */
  logger.info(`select ${selectedEmitter.package}`);
  const { action, version } = await npmUtil.ensureNpmPackageInstall(
    selectedEmitter.package,
    selectedEmitter.version,
  );
  /* TODO: check the dependent compiler version. */
  if (action === InstallationAction.Upgrade) {
    logger.info(`Upgrading ${selectedEmitter.package} to version ${version}`);
    const options = {
      ok: `OK (install ${selectedEmitter.package}@${version} by 'npm install'`,
      recheck: `Check again (install ${selectedEmitter.package} manually)`,
      ignore: `Ignore emitter ${selectedEmitter.label}`,
      cancel: "Cancel",
    };
    const selected = await vscode.window.showQuickPick(Object.values(options), {
      canPickMany: false,
      ignoreFocusOut: true,
      placeHolder: `Package '${selectedEmitter.package}' needs to be installed for emitting`,
      title: `TypeSpec Emit...`,
    });
    if (selected === options.ok) {
      packagesToInstall.push(`${selectedEmitter.package}@${version}`);
    }
  } else if (action === InstallationAction.Install) {
    // logger.info(`Installing ${e.package} version ${version}`, [], {
    //   showOutput: true,
    //   showPopup: true,
    //   progress: overallProgress,
    // });
    let packageFullName = selectedEmitter.package;
    if (selectedEmitter.version) {
      packageFullName = `${selectedEmitter.package}@${selectedEmitter.version}`;
    }
    logger.info(`Installing ${packageFullName}`);
    packagesToInstall.push(`${packageFullName}`);
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
  let outputDir = path.resolve(baseDir, "tsp-output", selectedEmitter.language);
  if (selectedEmitter.outputDir) {
    if (!path.isAbsolute(selectedEmitter.outputDir)) {
      outputDir = path.resolve(baseDir, selectedEmitter.outputDir);
    } else {
      outputDir = selectedEmitter.outputDir;
    }
  }

  const options: Record<string, string> = {};
  options["emitter-output-dir"] = outputDir;
  logger.info(`Generate Client SDK for ${selectedEmitter.language} ...`, [], {
    showOutput: false,
    showPopup: true,
    progress: overallProgress,
  });
  const compileResult = await compile(cli, startFile, selectedEmitter.package, options);
  if (compileResult.exitCode !== 0) {
    logger.error(
      `Failed to generate Client SDK for ${selectedEmitter.language}. error: ${compileResult.error}`,
      [],
      {
        showOutput: false,
        showPopup: true,
        progress: overallProgress,
      },
    );
  }
  logger.info(`complete generating ${selectedEmitter.language} SDK.`);

  /*TODO: build sdk. */
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
