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
  getRegisterEmittersByPackage,
  getRegisterEmitterTypes,
  PreDefinedEmitterPickItems,
} from "./emitter.js";

interface EmitQuickPickButton extends QuickInputButton {
  uri: string;
}

async function configureEmitter(context: vscode.ExtensionContext): Promise<Emitter | undefined> {
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
    return undefined;
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

  /* filter out already existing emitters. */
  const registerEmitters = getRegisterEmitters(codeType.emitterKind);
  const all: EmitQuickPickItem[] = [...registerEmitters].map((e) => toQuickPickItem(e));

  const emitterSelector = vscode.window.createQuickPick<EmitQuickPickItem>();
  emitterSelector.items = all;
  emitterSelector.title = `Generate from TypeSpec`;
  emitterSelector.canSelectMany = false;
  emitterSelector.placeholder = `Select a Language for ${codeType} code generation`;
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
    return undefined;
  }
  return {
    language: selectedEmitter.language,
    package: selectedEmitter.package,
    version: selectedEmitter.version,
    sourceRepo: selectedEmitter.sourceRepo,
    requisites: selectedEmitter.requisites,
    kind: selectedEmitter.emitterKind,
  };
}
async function doEmit(mainTspFile: string, emitter: Emitter) {
  if (!mainTspFile || !(await isFile(mainTspFile))) {
    logger.error(
      "Invalid typespec project. There is no main tsp file in the project. Generating Cancelled.",
      [],
      { showOutput: false, showPopup: true },
    );
    return;
  }

  const baseDir = getDirectoryPath(mainTspFile);

  const npmUtil = new NpmUtil(baseDir);
  const packagesToInstall: string[] = [];

  /* install emitter package. */
  logger.info(`select ${emitter.package}`);
  const { action, version } = await npmUtil.calculateNpmPackageInstallAction(
    emitter.package,
    emitter.version,
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
        const minimumRequisites = emitter.requisites
          ? ` Minimum requisites: install ${emitter.requisites?.join(", ")}`
          : "";
        let packageFullName = emitter.package;
        if (version) {
          packageFullName = `${emitter.package}@${version}`;
        }
        packageQuickPickItems.push({
          label: `${emitter.package}`,
          description: `TypeSpec library for emitting ${emitter.language} from TypeSpec files.`,
          detail: minimumRequisites,
          packageFullName: packageFullName,
          sourceRepo: emitter.sourceRepo,
          picked: true,
          buttons: emitter.sourceRepo
            ? [
                {
                  iconPath: new vscode.ThemeIcon("link-external"),
                  tooltip: "More details",
                  uri: emitter.sourceRepo,
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
  const defaultEmitOutputDirInConfig = `{output-dir}/{emitter-name}`;
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
              return item.value === emitter.package;
            }
            return false;
          });
          if (index === -1) {
            emitNode.items.push(emitter.package);
          }
        }
      }
    } else {
      configYaml.set("emit", [emitter.package]);
    }
    const emitOutputDir = configYaml.getIn(["options", emitter.package, "emitter-output-dir"]);
    if (!emitOutputDir) {
      configYaml.setIn(
        ["options", emitter.package, "emitter-output-dir"],
        defaultEmitOutputDirInConfig,
      );
    } else {
      outputDir = emitOutputDir as string;
    }
    const newYamlContent = configYaml.toString();
    await writeFile(tspConfigFile, newYamlContent);
  } catch (error: any) {
    logger.error(error);
  }

  outputDir = outputDir.replace("{project-root}", baseDir);
  outputDir = outputDir
    .replace("{output-dir}", `${baseDir}/tsp-output`)
    .replace("{emitter-name}", emitter.package);
  const options: Record<string, string> = {};
  logger.info(
    `Start to generate ${emitter.language} ${emitter.kind} code under directory ${outputDir}`,
  );
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Generating ${emitter.kind} code for ${emitter.language}...`,
      cancellable: false,
    },
    async () => {
      try {
        const compileResult = await compile(cli, mainTspFile, emitter.package, options, false);
        if (compileResult.exitCode !== 0) {
          logger.error(`Generating ${emitter.kind} code for ${emitter.language}...Failed`, [], {
            showOutput: true,
            showPopup: true,
          });
        } else {
          logger.info(`Generating ${emitter.kind} code for ${emitter.language}...Succeeded`, [], {
            showOutput: true,
            showPopup: true,
          });
        }
      } catch (err: any) {
        if (typeof err === "object" && "stdout" in err && "stderr" in err && `error` in err) {
          const execOutput = err as ExecOutput;
          const details = [];
          if (execOutput.stdout !== "") details.push(execOutput.stdout);
          if (execOutput.stderr !== "") details.push(execOutput.stderr);
          if (execOutput.error) details.push(execOutput.error);
          logger.error(
            `Generating ${emitter.kind} code for ${emitter.language}...Failed.`,
            details,
            {
              showOutput: true,
              showPopup: true,
            },
          );
        } else {
          logger.error(`Generating ${emitter.kind} code for ${emitter.language}...Failed.`, [err], {
            showOutput: true,
            showPopup: true,
          });
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
  const baseDir = getDirectoryPath(tspProjectFile);
  const tspConfigFile = path.join(baseDir, TspConfigFileName);
  let configYaml = parseDocument(""); //generate a empty yaml
  if (await isFile(tspConfigFile)) {
    const content = await readFile(tspConfigFile);
    configYaml = parseDocument(content.toString());
  }

  let existingEmitters;
  try {
    const emitNode = configYaml.get("emit");
    if (emitNode) {
      if (isSeq(emitNode)) {
        if (Array.isArray(emitNode.items)) {
          existingEmitters = emitNode.items.map((item) => {
            if (isScalar(item)) {
              return item.value as string;
            }
            return "";
          });
        }
      }
    }
  } catch (error: any) {
    logger.error(error);
  }

  const toEmitterQuickPickItem = (e: Emitter): EmitQuickPickItem => {
    return {
      language: e.language,
      package: e.package,
      version: e.version,
      requisites: e.requisites,
      sourceRepo: e.sourceRepo,
      emitterKind: e.kind,
      label: `${e.language} ${e.kind} code emitter`,
      description: `${e.package}.`,
      // detail: `Generate ${e.kind} code for ${e.language} by TypeSpec library ${e.package}.`,
      picked: false,
      fromConfig: true,
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
  /* display existing emitters in config.yaml. */
  if (existingEmitters && existingEmitters.length > 0) {
    const fromConfigSeparator = {
      label: "from tspconfig.yaml",
      description: "configured emitters in tspconfig.yaml",
      kind: vscode.QuickPickItemKind.Separator,
      info: undefined,
      package: "",
      fromConfig: false,
      picked: false,
    };
    const existingEmitterQuickPickItems = existingEmitters.map((e) => {
      const emitter = getRegisterEmittersByPackage(e);
      if (emitter) {
        return toEmitterQuickPickItem(emitter);
      } else {
        return {
          label: e,
          description: "Emit code by the emitter library.",
          picked: true,
          fromConfig: true,
          package: e,
          kind: vscode.QuickPickItemKind.Default,
        };
      }
    });
    const separatorItem = {
      kind: vscode.QuickPickItemKind.Separator,
      info: undefined,
      package: "",
      fromConfig: false,
      picked: false,
    };
    const newEmitterQuickPickItem = {
      label: "Choose another emitter",
      description: "Choose another emitter for code generation",
      picked: false,
      fromConfig: false,
      package: "",
      kind: vscode.QuickPickItemKind.Default,
      iconPath: new vscode.ThemeIcon("settings-gear"),
    };

    const allPickItems = [];
    allPickItems.push(
      fromConfigSeparator,
      ...existingEmitterQuickPickItems,
      separatorItem,
      newEmitterQuickPickItem,
    );
    const existingEmittersSelector = vscode.window.createQuickPick<any>();
    existingEmittersSelector.items = allPickItems;
    existingEmittersSelector.title = `Generate from TypeSpec`;
    existingEmittersSelector.canSelectMany = false;
    existingEmittersSelector.placeholder = "Select an emitter for code generation";
    existingEmittersSelector.ignoreFocusOut = true;
    existingEmittersSelector.show();
    const selectedExistingEmitter = await new Promise<EmitQuickPickItem>((resolve) => {
      existingEmittersSelector.onDidAccept(async () => {
        const selectedItem = existingEmittersSelector.selectedItems[0];
        if (selectedItem === newEmitterQuickPickItem) {
          const newEmitter = await configureEmitter(context);
          if (!newEmitter) {
            return;
          }
          resolve(toEmitterQuickPickItem(newEmitter));
        } else {
          resolve(existingEmittersSelector.selectedItems[0]);
          existingEmittersSelector.dispose();
        }
      });
    });
    if (!selectedExistingEmitter) {
      logger.info("No emitter selected. Generating Cancelled.");
      return;
    }
    await doEmit(
      tspProjectFile,
      getRegisterEmittersByPackage(selectedExistingEmitter.package) ?? {
        package: selectedExistingEmitter.package,
        language: "Unknown",
        kind: EmitterKind.Unknown,
      },
    );
  } else {
    const selectedEmitter = await configureEmitter(context);
    if (selectedEmitter) {
      await doEmit(tspProjectFile, selectedEmitter);
    } else {
      logger.info("No emitter selected. Generating Cancelled.");
      return;
    }
  }
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
