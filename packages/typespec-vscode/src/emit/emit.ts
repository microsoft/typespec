// import { TypeSpecConfig } from "@typespec/compiler";
import path, { dirname } from "path";
import vscode, { QuickInputButton, Uri } from "vscode";
import { Executable } from "vscode-languageclient/node.js";
import logger from "../log/logger.js";
import { InstallationAction, NpmUtil } from "../npm-utils.js";
import { getMainTspFile, resolveTypeSpecCli, toError, toOutput } from "../typespec-utils.js";
import { ExecOutput, isFile, promisifySpawn } from "../utils.js";
import { EmitQuickPickItem } from "./emit-quick-pick-item.js";
import { clientEmitters, Emitter } from "./emitter.js";
export async function doEmit(
  context: vscode.ExtensionContext,
  uri: vscode.Uri,
  overallProgress: vscode.Progress<{ message?: string; increment?: number }>,
) {
  let tspProjectFolder: string = "";
  if (!uri) {
    class MyButton implements QuickInputButton {
      constructor(
        public iconPath: { light: Uri; dark: Uri },
        public tooltip: string,
      ) {}
    }
    const openDiaglogButton = new MyButton(
      {
        dark: Uri.file(context.asAbsolutePath("./icons/openfolder.svg")),
        light: Uri.file(context.asAbsolutePath("./icons/openfolder.svg")),
      },
      "Browse...",
    );
    tspProjectFolder = await new Promise((resolve) => {
      const inputBox = vscode.window.createInputBox();
      inputBox.title = "Choose TypeSpec Project Directory";
      inputBox.prompt = "Choose the TypeSpec project.";
      inputBox.value = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : "";
      inputBox.placeholder = vscode.workspace.workspaceFolders
        ? vscode.workspace.workspaceFolders[0].uri.fsPath
        : "TypeSpec project folder or TypeSpec enterpointer file(e.g. main.tsp).";
      inputBox.buttons = [openDiaglogButton];
      const validateInput = async (text: string) => {
        if (text.trim() === "") {
          return "Please choose Typespec folder";
        }
        const start = await getMainTspFile(text);
        if (!start) {
          return "Cannot find main tsp file in the project. Please select a valid TypeSpec project folder.";
        }
        return null;
      };
      inputBox.onDidTriggerButton(async () => {
        const options = {
          canSelectMany: false,
          openLabel: "Choose TypeSpec Project Directory",
          canSelectFolders: true,
          canSelectFiles: false,
        };
        await vscode.window.showOpenDialog(options).then((uris) => {
          // tspProjectFolder = uris ? uris[0].fsPath : "";
          // inputBox.value = tspProjectFolder;
          inputBox.value = uris ? uris[0].fsPath : "";
          inputBox.validationMessage = undefined;
        });
      });

      inputBox.onDidChangeValue(async (text) => {
        const validate = await validateInput(text);
        if (validate !== null) {
          inputBox.validationMessage = validate;
        } else {
          inputBox.validationMessage = undefined;
        }
      });

      inputBox.onDidAccept(async () => {
        const userInput = inputBox.value;
        const validate = await validateInput(userInput);
        if (validate === null) {
          resolve(userInput);
        } else {
          inputBox.validationMessage = validate;
        }
      });
      inputBox.ignoreFocusOut = true;
      inputBox.show();
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
  logger.info("select language...", [], {
    showOutput: false,
    showPopup: false,
    progress: overallProgress,
  });

  const startFile = await getMainTspFile(tspProjectFolder);

  if (!startFile) {
    logger.info(
      "Invalid typespec project. There is no main tsp file in the project. Emit canceled.",
      [],
      { showOutput: false, showPopup: true, progress: overallProgress },
    );
    return;
  }

  const toQuickPickItem = (e: Emitter): EmitQuickPickItem => {
    return {
      language: e.language,
      package: e.package,
      label: e.language,
      detail: `Create ${e.language} sdk from ${e.package}`,
      picked: false,
      fromConfig: false,
      iconPath: Uri.file(context.asAbsolutePath(`./icons/${e.language.toLowerCase()}.svg`)),
    };
  };

  const all = [...clientEmitters].map((e) => toQuickPickItem(e));

  const selectedEmitter = await vscode.window.showQuickPick<EmitQuickPickItem>(all, {
    title: "Select the Language of the SDK",
    canPickMany: false,
    placeHolder: "Pick a Language",
    ignoreFocusOut: true,
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
  const { valid, required } = await check(`${baseDir}/main.tsp`);
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

  const configFile = path.resolve(baseDir, "tspconfig.yaml");
  // let typespecConfig = undefined;
  if (!(await isFile(configFile))) {
    await vscode.window
      .showQuickPick(["Yes", "No"], {
        title: "No tspconfig.yaml found in the project directory. Do you want to create one?",
        canPickMany: false,
        placeHolder: "Pick a option",
        ignoreFocusOut: true,
      })
      .then(async (selection) => {
        if (selection === "Yes") {
          /* create tspconfig.yaml */
          const yaml = `options:\n  "${selectedEmitter.package}":\n    emitter-output-dir: client/${selectedEmitter.language}`;
          await vscode.workspace.fs.writeFile(
            vscode.Uri.file(path.resolve(baseDir, "tspconfig.yaml")),
            Buffer.from(yaml),
          );
          const document = await vscode.workspace.openTextDocument(
            vscode.Uri.file(path.resolve(baseDir, "tspconfig.yaml")),
          );
          vscode.window.showTextDocument(document, {
            preview: false,
            viewColumn: vscode.ViewColumn.Two,
          });
        }
      });
  } else {
    /* check the emitter in the tspConfig.yaml */
    // const document = await vscode.workspace.openTextDocument(configFile);
    // const doc = parseDocument(document.getText(), {
    //   prettyErrors: false, // We are handling the error display ourself to be consistent in the style.
    // });
    // typespecConfig = doc.toJSON();
  }

  /* config the output dir. */
  // const optionsInConfig = typespecConfig?.options
  //   ? typespecConfig?.options[`${selectedEmitter.package}`]
  //   : undefined;
  // const outputDirInConfig = optionsInConfig ? optionsInConfig["emitter-output-dir"] : undefined;
  const outputDirInConfig = undefined;
  const outputDirInput = await vscode.window.showInputBox({
    title: `Configure output directory for ${selectedEmitter.language}`,
    placeHolder: `client/${selectedEmitter.language}`,
    value: outputDirInConfig ?? `client/${selectedEmitter.language}`,
    prompt: `Please provide the output directory for ${selectedEmitter.language} SDK`,
    validateInput: (text: string) => {
      return text.trim() === "" ? "Input cannot be empty" : null;
    },
    ignoreFocusOut: true,
  });
  selectedEmitter.outputDir = outputDirInput;
  // if (optionsInConfig) {
  //   optionsInConfig["emitter-output-dir"] = outputDirInput;
  //   typespecConfig!.options![`${selectedEmitter.package}`] = optionsInConfig;
  // }

  /* save emitter config */
  // await vscode.workspace.fs.writeFile(
  //   vscode.Uri.file(path.resolve(baseDir, "tspconfig.yaml")),
  //   Buffer.from(stringify(typespecConfig)),
  // );

  /* config the emitter in the tspConfig.yaml */
  await vscode.window
    .showQuickPick(["Yes", "No"], {
      title: "configure the emitters in the tspConfig.yaml?",
      canPickMany: false,
      placeHolder: "Pick a option",
      ignoreFocusOut: true,
    })
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
          .showQuickPick(["Completed"], {
            title: "Is emitter configuration completed?",
            canPickMany: false,
            placeHolder: "Pick a option",
            ignoreFocusOut: true,
          })
          .then((selection) => {
            if (selection === "Completed") {
              vscode.commands.executeCommand("workbench.action.closeActiveEditor");
            }
          });
      }
    });

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
      const npmInstallResult = await npmUtil.npmInstallPackages(packagesToInstall, undefined, {
        onStdioOut: toOutput,
        onStdioError: toError,
      });
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
      logger.error(`Exception occurred when installing packages: ${err}`, [], {
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
    logger.error(`Failed to generate Client SDK for ${selectedEmitter.language}.`, [], {
      showOutput: true,
      showPopup: true,
      progress: overallProgress,
    });
  }

  logger.info(`complete generating ${selectedEmitter.language} SDK.`, [], {
    showOutput: true,
    showPopup: true,
    progress: overallProgress,
  });

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

  return await promisifySpawn(
    cli.command,
    args,
    {
      cwd: dirname(startFile),
    },
    { onStdioOut: toOutput, onStdioError: toError },
  );
}

export async function check(startFile: string): Promise<{
  valid: boolean;
  required: { name: string; version: string }[];
}> {
  // await new Promise((resolve) => {
  //   setTimeout(resolve, 180000);
  //   logger.info(`complete runtime check.`);
  // });
  const cli = await resolveTypeSpecCli(dirname(startFile));
  if (!cli) {
    return { valid: true, required: [] };
  }
  const args: string[] = cli.args ?? [];
  args.push("compile");
  args.push(startFile);
  args.push("--no-emit");
  await promisifySpawn(cli.command, args, {
    cwd: dirname(startFile),
  });
  logger.info(`complete runtime check.`);
  return { valid: true, required: [] };
}
