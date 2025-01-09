import { readFile, writeFile } from "fs/promises";
import path from "path";
import vscode, { QuickInputButton, Uri } from "vscode";
import { Executable } from "vscode-languageclient/node.js";
import { isScalar, isSeq, parseDocument } from "yaml";
import { StartFileName, TspConfigFileName } from "../../const.js";
import logger from "../../log/logger.js";
import { InstallAction, npmDependencyType, NpmUtil } from "../../npm-utils.js";
import { getDirectoryPath } from "../../path-utils.js";
import { resolveTypeSpecCli } from "../../tsp-executable-resolver.js";
import { getEntrypointTspFile, TraverseMainTspFileInWorkspace } from "../../typespec-utils.js";
import { ExecOutput, isFile, spawnExecutionAndLogToOutput } from "../../utils.js";
import { EmitQuickPickItem } from "./emit-quick-pick-item.js";
import {
  Emitter,
  EmitterKind,
  getLanguageAlias,
  getRegisterEmitters,
  getRegisterEmitterTypes,
  PreDefinedEmitterPickItems,
} from "./emitter.js";

async function doEmit(context: vscode.ExtensionContext, mainTspFile: string, kind: EmitterKind) {
  if (!mainTspFile || !(await isFile(mainTspFile))) {
    logger.error(
      "Invalid typespec project. There is no main tsp file in the project. Generating Cancelled.",
      [],
      { showOutput: false, showPopup: true },
    );
    return;
  }

  const baseDir = getDirectoryPath(mainTspFile);

  interface EmitQuickPickButton extends QuickInputButton {
    uri: string;
  }
  const toQuickPickItem = (e: Emitter): EmitQuickPickItem => {
    const buttons = e.sourceRepo
      ? [
          {
            iconPath: new vscode.ThemeIcon("link-external"),
            tooltip: "More details",
            uri: e.sourceRepo,
          },
        ]
      : undefined;
    return {
      language: e.language,
      package: e.package,
      version: e.version,
      requisites: e.requisites,
      sourceRepo: e.sourceRepo,
      emitterKind: e.kind,
      label: e.language,
      detail: `Generate ${e.kind} code for ${e.language} by TypeSpec library ${e.package}.`,
      picked: false,
      fromConfig: false,
      buttons: buttons,
      iconPath: {
        light: Uri.file(
          context.asAbsolutePath(`./icons/${getLanguageAlias(e.language).toLowerCase()}.light.svg`),
        ),
        dark: Uri.file(
          context.asAbsolutePath(`./icons/${getLanguageAlias(e.language).toLowerCase()}.dark.svg`),
        ),
      },
    };
  };

  const registerEmitters = getRegisterEmitters(kind);
  const all: EmitQuickPickItem[] = [...registerEmitters].map((e) => toQuickPickItem(e));

  const emitterSelector = vscode.window.createQuickPick<EmitQuickPickItem>();
  emitterSelector.items = all;
  emitterSelector.title = `Generate from TypeSpec`;
  emitterSelector.canSelectMany = false;
  emitterSelector.placeholder = `Select a Language for ${kind} code generation`;
  emitterSelector.ignoreFocusOut = true;
  emitterSelector.onDidTriggerItemButton(async (e) => {
    if (e.button.tooltip === "More details") {
      const url = (e.button as EmitQuickPickButton).uri;
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }
  });
  emitterSelector.show();
  const selectedEmitter = await new Promise<EmitQuickPickItem>((resolve) => {
    emitterSelector.onDidAccept(() => {
      resolve(emitterSelector.selectedItems[0]);
      emitterSelector.dispose();
    });
  });

  if (!selectedEmitter) {
    logger.info("No language selected. Generating Cancelled.");
    return;
  }

  const npmUtil = new NpmUtil(baseDir);
  const packagesToInstall: string[] = [];

  /* install emitter package. */
  logger.info(`select ${selectedEmitter.package}`);
  const { action, version } = await npmUtil.calculateNpmPackageInstallAction(
    selectedEmitter.package,
    selectedEmitter.version,
  );

  const installPackageQuickPickItems = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Calculating packages to install or upgrade ...",
      cancellable: false,
    },
    async () => {
      const packageQuickPickItems = [];
      if (action === InstallAction.Upgrade || action === InstallAction.Install) {
        const minimumRequisites = selectedEmitter.requisites
          ? ` Minimum requisites: install ${selectedEmitter.requisites?.join(", ")}`
          : "";
        let packageFullName = selectedEmitter.package;
        if (version) {
          packageFullName = `${selectedEmitter.package}@${version}`;
        }
        packageQuickPickItems.push({
          label: `${selectedEmitter.package}`,
          description: `TypeSpec library for emitting ${selectedEmitter.language} from TypeSpec files.`,
          detail: minimumRequisites,
          packageFullName: packageFullName,
          sourceRepo: selectedEmitter.sourceRepo,
          picked: true,
          buttons: selectedEmitter.sourceRepo
            ? [
                {
                  iconPath: new vscode.ThemeIcon("link-external"),
                  tooltip: "More details",
                  uri: selectedEmitter.sourceRepo,
                },
              ]
            : undefined,
        });
        packagesToInstall.push(packageFullName);
      }

      for (const p of packagesToInstall) {
        /* verify dependency packages. */
        try {
          const dependenciesToInstall = await npmUtil.calculateNpmPackageDependencyToUpgrade(
            p,
            version,
            [npmDependencyType.dependencies, npmDependencyType.peerDependencies],
          );
          if (dependenciesToInstall.length > 0) {
            packagesToInstall.push(...dependenciesToInstall.map((d) => `${d.name}@${d.version}`));
            for (const dep of dependenciesToInstall) {
              const packageFullName = `${dep.name}@${version ?? "latest"}`;
              packageQuickPickItems.push({
                label: `${dep.name}`,
                description: "Required for enabling the emitter library.",
                packageFullName: packageFullName,
                picked: true,
              });
            }
          }
        } catch (err) {
          logger.error(`Exception occurred when check dependency packages for ${p}.`);
        }
      }
      return packageQuickPickItems;
    },
  );

  if (installPackageQuickPickItems.length > 0) {
    const installPackagesSelector = vscode.window.createQuickPick<any>();
    installPackagesSelector.items = installPackageQuickPickItems;
    installPackagesSelector.title = `Generate from TypeSpec`;
    installPackagesSelector.canSelectMany = true;
    installPackagesSelector.placeholder = "Here are libraries to install or update.";
    installPackagesSelector.ignoreFocusOut = true;
    installPackagesSelector.selectedItems = [...installPackageQuickPickItems];
    installPackagesSelector.onDidTriggerItemButton(async (e) => {
      if (e.button.tooltip === "More details") {
        const url = (e.button as EmitQuickPickButton).uri;
        await vscode.env.openExternal(vscode.Uri.parse(url));
      }
    });
    installPackagesSelector.show();
    const selectedPackages = await new Promise<readonly any[]>((resolve) => {
      installPackagesSelector.onDidAccept(() => {
        resolve(installPackagesSelector.selectedItems);
        installPackagesSelector.dispose();
      });
    });
    if (!selectedPackages || selectedPackages.length === 0) {
      logger.info("No package selected. Generating Cancelled.", [], {
        showOutput: true,
        showPopup: true,
      });
      return;
    }
    /* npm install packages. */
    if (selectedPackages.length > 0) {
      const installPackages = selectedPackages.map((p) => p.packageFullName);
      logger.info(`Install ${installPackages.join(",")} under directory ${baseDir}`);
      const installResult = await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Installing packages...",
          cancellable: false,
        },
        async () => {
          try {
            const npmInstallResult = await npmUtil.npmInstallPackages(installPackages, undefined);
            if (npmInstallResult.exitCode !== 0) {
              return false;
            } else {
              return true;
            }
          } catch (err: any) {
            return false;
          }
        },
      );
      if (!installResult) {
        logger.error(`Error occurred when installing packages. Generating Cancelled.`, [], {
          showOutput: false,
          showPopup: true,
        });
        return;
      }
    }
  }

  /* emit */
  const cli = await resolveTypeSpecCli(baseDir);
  if (!cli) {
    logger.error(
      "Cannot find TypeSpec CLI. Please install @typespec/compiler. Generating Cancelled.",
      [],
      {
        showOutput: true,
        showPopup: true,
      },
    );
    return;
  }
  /*Config emitter output dir and emit in tspconfig.yaml. */
  const defaultEmitOutputDirInConfig = `{project-root}/${selectedEmitter.emitterKind}/${getLanguageAlias(selectedEmitter.language)}`;
  const tspConfigFile = path.join(baseDir, TspConfigFileName);
  let configYaml = parseDocument(""); //generate a empty yaml
  if (await isFile(tspConfigFile)) {
    const content = await readFile(tspConfigFile);
    configYaml = parseDocument(content.toString());
  }
  let outputDir = defaultEmitOutputDirInConfig;
  try {
    /*update emitter in config.yaml. */
    const emitNode = configYaml.get("emit");
    if (emitNode) {
      if (isSeq(emitNode)) {
        if (Array.isArray(emitNode.items)) {
          const index = emitNode.items.findIndex((item) => {
            if (isScalar(item)) {
              return item.value === selectedEmitter.package;
            }
            return false;
          });
          if (index === -1) {
            emitNode.items.push(selectedEmitter.package);
          }
        }
      }
    } else {
      configYaml.set("emit", [selectedEmitter.package]);
    }
    const optionsObject = configYaml.get("options");
    if (!optionsObject) {
      configYaml.set("options", {
        [selectedEmitter.package]: {
          "emitter-output-dir": defaultEmitOutputDirInConfig,
        },
      });
    } else {
      const emitterOptions = configYaml.getIn(["options", selectedEmitter.package]);
      if (!emitterOptions) {
        const optionRecord = optionsObject as Record<string, any>;
        optionRecord[selectedEmitter.package] = {
          "emitter-output-dir": defaultEmitOutputDirInConfig,
        };
      } else {
        const emitOutputDir = configYaml.getIn([
          "options",
          selectedEmitter.package,
          "emitter-output-dir",
        ]);
        if (emitOutputDir) {
          outputDir = emitOutputDir as string;
        } else {
          configYaml.setIn(
            ["options", selectedEmitter.package, "emitter-output-dir"],
            defaultEmitOutputDirInConfig,
          );
        }
      }
    }
    const newYamlContent = configYaml.toString();
    await writeFile(tspConfigFile, newYamlContent);
  } catch (error: any) {
    logger.error(error);
  }

  outputDir = outputDir.replace("{project-root}", baseDir);
  const options: Record<string, string> = {};
  logger.info(
    `Start to generate ${selectedEmitter.language} ${selectedEmitter.emitterKind} code under directory ${outputDir}`,
  );
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Generating ${selectedEmitter.emitterKind} code for ${selectedEmitter.language}...`,
      cancellable: false,
    },
    async () => {
      try {
        const compileResult = await compile(
          cli,
          mainTspFile,
          selectedEmitter.package,
          options,
          false,
        );
        if (compileResult.exitCode !== 0) {
          logger.error(
            `Generating ${selectedEmitter.emitterKind} code for ${selectedEmitter.language}...Failed`,
            [],
            {
              showOutput: true,
              showPopup: true,
            },
          );
        } else {
          logger.info(
            `Generating ${selectedEmitter.emitterKind} code for ${selectedEmitter.language}...Succeeded`,
            [],
            {
              showOutput: true,
              showPopup: true,
            },
          );
        }
      } catch (err: any) {
        if (typeof err === "object" && "stdout" in err && "stderr" in err && `error` in err) {
          const execOutput = err as ExecOutput;
          const details = [];
          if (execOutput.stdout !== "") details.push(execOutput.stdout);
          if (execOutput.stderr !== "") details.push(execOutput.stderr);
          if (execOutput.error) details.push(execOutput.error);
          logger.error(
            `Generating ${selectedEmitter.emitterKind} code for ${selectedEmitter.language}...Failed.`,
            details,
            {
              showOutput: true,
              showPopup: true,
            },
          );
        } else {
          logger.error(
            `Generating ${selectedEmitter.emitterKind} code for ${selectedEmitter.language}...Failed.`,
            [err],
            {
              showOutput: true,
              showPopup: true,
            },
          );
        }
      }
    },
  );
}

export async function emitCode(context: vscode.ExtensionContext, uri: vscode.Uri) {
  let tspProjectFile: string = "";
  if (!uri) {
    const targetPathes = await TraverseMainTspFileInWorkspace();
    logger.info(`Found ${targetPathes.length} ${StartFileName} files`);
    if (targetPathes.length === 0) {
      logger.info(`No entrypoint file (${StartFileName}) found. Generating Cancelled.`, [], {
        showOutput: true,
        showPopup: true,
      });
      return;
    } else if (targetPathes.length === 1) {
      tspProjectFile = targetPathes[0];
    } else {
      const toProjectPickItem = (filePath: string): any => {
        return {
          label: `Project: ${filePath}`,
          path: filePath,
          iconPath: {
            light: Uri.file(context.asAbsolutePath(`./icons/tsp-file.light.svg`)),
            dark: Uri.file(context.asAbsolutePath(`./icons/tsp-file.dark.svg`)),
          },
        };
      };
      const typespecProjectQuickPickItems: any[] = targetPathes.map((filePath) =>
        toProjectPickItem(filePath),
      );
      const selectedProjectFile = await vscode.window.showQuickPick(typespecProjectQuickPickItems, {
        title: "Generate from TypeSpec",
        canPickMany: false,
        placeHolder: "Select a project",
        ignoreFocusOut: true,
      });
      if (!selectedProjectFile) {
        logger.info("No project selected. Generating Cancelled.", [], {
          showOutput: true,
          showPopup: true,
        });
        return;
      }
      tspProjectFile = selectedProjectFile.path;
    }
  } else {
    const tspStartFile = await getEntrypointTspFile(uri.fsPath);
    if (!tspStartFile) {
      logger.info(`No entrypoint file (${StartFileName}). Invalid typespec project.`, [], {
        showOutput: true,
        showPopup: true,
      });
      return;
    }
    tspProjectFile = tspStartFile;
  }

  logger.info(`Generate from entrypoint file: ${tspProjectFile}`);

  const emitterKinds = getRegisterEmitterTypes();
  const toEmitterTypeQuickPickItem = (kind: EmitterKind): any => {
    const registerEmitters = getRegisterEmitters(kind);
    const supportedLanguages = registerEmitters.map((e) => e.language).join(", ");
    return {
      label: PreDefinedEmitterPickItems[kind]?.label ?? kind,
      detail:
        PreDefinedEmitterPickItems[kind]?.detail ??
        `Generate ${kind} code from TypeSpec files. Supported languages are ${supportedLanguages}.`,
      emitterKind: kind,
      iconPath: {
        light: Uri.file(context.asAbsolutePath(`./icons/${kind.toLowerCase()}.light.svg`)),
        dark: Uri.file(context.asAbsolutePath(`./icons/${kind.toLowerCase()}.dark.svg`)),
      },
    };
  };
  const codesToEmit = emitterKinds.map((kind) => toEmitterTypeQuickPickItem(kind));
  const codeType = await vscode.window.showQuickPick(codesToEmit, {
    title: "Generate from TypeSpec",
    canPickMany: false,
    placeHolder: "Select an emitter type",
    ignoreFocusOut: true,
  });
  if (!codeType) {
    logger.info("No emitter Type selected. Generating Cancelled.");
    return;
  }
  await doEmit(context, tspProjectFile, codeType.emitterKind);
}

async function compile(
  cli: Executable,
  startFile: string,
  emitter: string,
  options: Record<string, string>,
  logPretty?: boolean,
): Promise<ExecOutput> {
  const args: string[] = cli.args ?? [];
  args.push("compile");
  args.push(startFile);
  if (emitter) {
    args.push("--emit", emitter);
  }
  if (logPretty !== undefined) {
    args.push("--pretty");
    args.push(logPretty ? "true" : "false");
  }

  for (const [key, value] of Object.entries(options)) {
    args.push("--option", `${emitter}.${key}=${value}`);
  }

  return await spawnExecutionAndLogToOutput(cli.command, args, getDirectoryPath(startFile));
}
