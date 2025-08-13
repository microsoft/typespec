import { NodeSystemHost, resolveCompilerOptions } from "@typespec/compiler/internals";
import { createHash } from "crypto";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { inspect } from "util";
import vscode, { QuickInputButton, Uri } from "vscode";
import { Document, isScalar, isSeq } from "yaml";
import { StartFileName, TspConfigFileName } from "../../const.js";
import { tspLanguageClient } from "../../extension-context.js";
import logger from "../../log/logger.js";
import { InstallAction, npmDependencyType, NpmUtil } from "../../npm-utils.js";
import { getDirectoryPath } from "../../path-utils.js";
import telemetryClient from "../../telemetry/telemetry-client.js";
import { OperationTelemetryEvent } from "../../telemetry/telemetry-event.js";
import { resolveTypeSpecCli } from "../../tsp-executable-resolver.js";
import { TspLanguageClient } from "../../tsp-language-client.js";
import { ResultCode } from "../../types.js";
import {
  formatDiagnostic,
  getEntrypointTspFile,
  loadEmitterOptions,
  TraverseMainTspFileInWorkspace,
} from "../../typespec-utils.js";
import {
  ExecOutput,
  getVscodeUriFromPath,
  isFile,
  tryParseYaml,
  tryReadFile,
} from "../../utils.js";
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
        `Emit ${kind} code from TypeSpec files. Supported languages are ${supportedLanguages}.`,
      emitterKind: kind,
      iconPath: {
        light: Uri.file(context.asAbsolutePath(`./icons/${kind.toLowerCase()}.light.svg`)),
        dark: Uri.file(context.asAbsolutePath(`./icons/${kind.toLowerCase()}.dark.svg`)),
      },
    };
  };
  const codeTypesToEmit = emitterKinds.map((kind) => toEmitterTypeQuickPickItem(kind));
  const codeType = await vscode.window.showQuickPick(codeTypesToEmit, {
    title: "Emit from TypeSpec",
    canPickMany: false,
    placeHolder: "Select an emitter type",
    ignoreFocusOut: true,
  });
  if (!codeType) {
    logger.info("No emitter type selected. Emitting Cancelled.");
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
      detail: `Emit ${e.kind} code for ${e.language} by TypeSpec library ${e.package}.`,
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

  const registerEmitters = getRegisterEmitters(codeType.emitterKind);
  const all: EmitQuickPickItem[] = [...registerEmitters].map((e) => toQuickPickItem(e));

  const emitterSelector = vscode.window.createQuickPick<EmitQuickPickItem>();
  emitterSelector.items = all;
  emitterSelector.title = `Emit from TypeSpec`;
  emitterSelector.canSelectMany = false;
  emitterSelector.placeholder = `Select a language for${codeType.emitterKind !== EmitterKind.Unknown ? " " + codeType.emitterKind : ""} code emitting`;
  emitterSelector.ignoreFocusOut = true;
  emitterSelector.onDidTriggerItemButton(async (e) => {
    if (e.button.tooltip === "More details") {
      const url = (e.button as EmitQuickPickButton).uri;
      await vscode.env.openExternal(vscode.Uri.parse(url));
    }
  });
  emitterSelector.show();
  const selectedEmitter = await new Promise<EmitQuickPickItem | undefined>((resolve) => {
    emitterSelector.onDidAccept(() => {
      resolve(emitterSelector.selectedItems[0]);
      emitterSelector.hide();
    });

    emitterSelector.onDidHide(() => {
      if (emitterSelector.selectedItems.length === 0) {
        resolve(undefined);
      }
      emitterSelector.dispose();
    });
  });

  if (!selectedEmitter) {
    logger.info("No language selected. Emitting Cancelled.");
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

async function doEmit(
  mainTspFile: string,
  emitters: Emitter[],
  tel: OperationTelemetryEvent,
): Promise<ResultCode> {
  if (!mainTspFile || !(await isFile(mainTspFile))) {
    logger.error(
      "Invalid TypeSpec project. There is no main tsp file in the project. Emitting Cancelled.",
      [],
      { showOutput: false, showPopup: true },
    );
    telemetryClient.logOperationDetailTelemetry(tel.activityId, {
      error: "no main tsp file found in the project.",
    });
    tel.lastStep = "Check main tsp file for emitting";
    return ResultCode.Fail;
  }

  if (emitters.length === 0) {
    logger.info("No emitter. Emitting skipped.");
    tel.lastStep = "Check emitters for emitting";
    return ResultCode.Cancelled;
  }
  const baseDir = getDirectoryPath(mainTspFile);

  const npmUtil = new NpmUtil(baseDir);
  const packagesToInstall: { name: string; version?: string }[] = [];

  const installPackageQuickPickItems = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Calculating packages to install or upgrade ...",
      cancellable: false,
    },
    async () => {
      const installCalculationPromises = emitters.map(async (emitter) => {
        const packageQuickPickItems = [];
        /* install emitter package. */
        logger.debug(`Start to calculate packages for ${emitter.package}`);
        const { action, version } = await npmUtil.calculateNpmPackageInstallAction(
          emitter.package,
          emitter.version,
        );
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
          packagesToInstall.push({ name: emitter.package, version: version });
        }
        for (const p of packagesToInstall) {
          /* verify dependency packages. */
          try {
            const dependenciesToInstall = (
              await npmUtil.calculateNpmPackageDependencyToUpgrade(p.name, p.version, [
                npmDependencyType.dependencies,
                npmDependencyType.peerDependencies,
              ])
            ).filter((d) => !packagesToInstall.includes(d));
            if (dependenciesToInstall.length > 0) {
              packagesToInstall.push(...dependenciesToInstall);
              for (const dep of dependenciesToInstall) {
                const packageFullName = `${dep.name}@${dep.version ?? "latest"}`;
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
          logger.debug(`completed calculate libraries for ${emitter.package}`);
        }
        return packageQuickPickItems;
      });

      try {
        const results = await Promise.all(installCalculationPromises);
        return results
          .flat()
          .filter(
            (item, index, self) =>
              index === self.findIndex((i) => i.packageFullName === item.packageFullName),
          );
      } catch (error: any) {
        logger.error("Failed to calculate packages to install:", [error]);
        return [];
      }
    },
  );

  if (installPackageQuickPickItems.length > 0) {
    const installPackagesSelector = vscode.window.createQuickPick();
    installPackagesSelector.items = installPackageQuickPickItems;
    installPackagesSelector.title = `Emit from TypeSpec`;
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
        installPackagesSelector.hide();
      });

      installPackagesSelector.onDidHide(() => {
        resolve([]);
        installPackagesSelector.dispose();
      });
    });
    if (!selectedPackages || selectedPackages.length === 0) {
      logger.info("No package selected. Emitting Cancelled.", [], {
        showOutput: true,
        showPopup: true,
      });
      tel.lastStep = "Select packages to install";
      return ResultCode.Cancelled;
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
              telemetryClient.logOperationDetailTelemetry(tel.activityId, {
                error: `npm install failed: ${inspect(npmInstallResult)}`,
              });
              return false;
            } else {
              return true;
            }
          } catch (err: any) {
            telemetryClient.logOperationDetailTelemetry(tel.activityId, {
              error: `npm install failed: ${inspect(err)}`,
            });
            return false;
          }
        },
      );
      if (!installResult) {
        logger.error(`Error occurred when installing packages. Emitting Cancelled.`, [], {
          showOutput: false,
          showPopup: true,
        });
        tel.lastStep = "Install packages";
        return ResultCode.Fail;
      }
    }
  }

  /* emit */
  const cli = await resolveTypeSpecCli(baseDir);
  if (!cli) {
    logger.error(
      "Cannot find TypeSpec CLI. Please install @typespec/compiler. Emitting Cancelled.",
      [],
      {
        showOutput: true,
        showPopup: true,
      },
    );
    telemetryClient.logOperationDetailTelemetry(tel.activityId, {
      error: "Cannot find TypeSpec CLI.",
    });
    tel.lastStep = "Resolve TypeSpec CLI";
    return ResultCode.Fail;
  }
  /*Config emitter output dir and emit in tspconfig.yaml. */
  const defaultEmitOutputDirInConfig = `{output-dir}/{emitter-name}`;
  const tspConfigFile = path.join(baseDir, TspConfigFileName);
  let configYaml = new Document(); //generate a empty yaml
  if (await isFile(tspConfigFile)) {
    const content = await tryReadFile(tspConfigFile);
    if (content) {
      configYaml = tryParseYaml(content.toString()) ?? configYaml;
    }
  }

  const generations: {
    emitter: Emitter;
    outputDir: string;
    options?: Record<string, string>;
    codeInfo: string;
  }[] = [];
  try {
    for (const emitter of emitters) {
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

      const defaultEmitKey = "emitter-output-dir";
      const emitOutputDir = configYaml.getIn(["options", emitter.package, defaultEmitKey]);
      if (!emitOutputDir) {
        configYaml.setIn(
          ["options", emitter.package, defaultEmitKey],
          defaultEmitOutputDirInConfig,
        );

        await generateAnnotatedYamlFile(configYaml, emitter.package, baseDir);
      }
    }
    const newYamlContent = configYaml.toString();
    await writeFile(tspConfigFile, newYamlContent);

    const [tspConfigOptions, diagnostics] = await resolveCompilerOptions(NodeSystemHost, {
      entrypoint: mainTspFile,
      cwd: baseDir,
    });
    if (diagnostics.length > 0) {
      logger.debug(
        "TypeSpec config diagnostics:",
        diagnostics.map((d) => d.message),
      );
    }
    for (const emitter of emitters) {
      let codeInfoStr: string = "code";
      if (emitter.kind !== EmitterKind.Unknown) {
        codeInfoStr = `${emitter.kind} code`;
      }
      if (emitter.language) {
        codeInfoStr += ` for ${emitter.language}`;
      }

      let outputDir: string | undefined;
      if (tspConfigOptions.options) {
        outputDir = tspConfigOptions.options[emitter.package]["emitter-output-dir"];
      }
      generations.push({
        emitter: emitter,
        outputDir: outputDir ?? `${baseDir}/tsp-output/${emitter.package}`,
        codeInfo: codeInfoStr,
      });
    }
  } catch (error: any) {
    logger.error(error);
  }

  const allCodesToGenerate = generations
    .map((g) => `${g.codeInfo} under directory ${g.outputDir}`)
    .join(", ");

  logger.info(`Start to emit ${allCodesToGenerate}...`);

  const codeInfoStr = generations.map((g) => g.codeInfo).join(", ");
  return await vscode.window.withProgress<ResultCode>(
    {
      location: vscode.ProgressLocation.Notification,
      title: `Emitting ${codeInfoStr}...`,
      cancellable: false,
    },
    async (): Promise<ResultCode> => {
      try {
        tel.lastStep = "Emit code";
        const generatePackageNameForTelemetry = (packageName: string): string => {
          const p = getRegisterEmittersByPackage(packageName);
          if (p) {
            // replace / and @ with #, otherwise vscode telemetry library will treat it as a path/email and redacted it.
            return p.package.replace(/[/|@]/g, "#");
          } else {
            // for unknown emitters, hash the package name for privacy.
            return createHash("sha256").update(packageName).digest("hex");
          }
        };
        emitters.forEach(async (e) => {
          telemetryClient.logOperationDetailTelemetry(tel.activityId, {
            emitterName: generatePackageNameForTelemetry(e.package),
            emitterVersion: e.version ?? (await npmUtil.loadNpmPackage(e.package))?.version,
          });
        });

        telemetryClient.logOperationDetailTelemetry(tel.activityId, {
          CompileStartTime: new Date().toISOString(), // ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
        });
        if (!tspLanguageClient) {
          logger.error("LSP client is not started.");
          logger.error(`Emitting ${codeInfoStr}...Failed.`, [], {
            showOutput: true,
            showPopup: true,
          });
          return ResultCode.Fail;
        }

        const compileResult = await tspLanguageClient.compileProject(
          {
            uri: getVscodeUriFromPath(mainTspFile),
          },
          { emit: emitters.map((e) => e.package) },
        );
        if (!compileResult) {
          logger.error(`Emitting ${codeInfoStr}...Failed.`, [], {
            showOutput: true,
            showPopup: true,
          });
          return ResultCode.Fail;
        }
        const addSuffix = (count: number, suffix: string) =>
          count > 1 ? `${count} ${suffix}s` : count === 1 ? `${count} ${suffix}` : undefined;
        const warningDiagnostics = compileResult.diagnostics.filter(
          (d) => d.severity === "warning",
        );
        if (warningDiagnostics.length > 0) {
          logger.warning(`Found ${addSuffix(warningDiagnostics.length, "warning")}`);
          for (const diag of warningDiagnostics) {
            logger.warning(formatDiagnostic(diag));
          }
        }
        const errorDiagnostics = compileResult.diagnostics.filter((d) => d.severity === "error");
        if (errorDiagnostics.length > 0) {
          logger.error(`Found ${addSuffix(errorDiagnostics.length, "error")}`);
          for (const diag of errorDiagnostics) {
            logger.error(formatDiagnostic(diag));
          }
        }
        if (compileResult.hasError) {
          logger.error(`Emitting ${codeInfoStr}...Failed`, [], {
            showOutput: true,
            showPopup: true,
          });
          telemetryClient.logOperationDetailTelemetry(tel.activityId, {
            emitResult: `Emitting code failed: ${inspect(compileResult)}`,
          });
          return ResultCode.Fail;
        } else {
          logger.info(`Emitting ${codeInfoStr}...Succeeded`, [], {
            showOutput: true,
            showPopup: true,
          });
          return ResultCode.Success;
        }
      } catch (err: any) {
        if (typeof err === "object" && "stdout" in err && "stderr" in err && `error` in err) {
          const execOutput = err as ExecOutput;
          const details = [];
          if (execOutput.error) details.push(execOutput.error);
          logger.error(`Emitting ${codeInfoStr}...Failed.`, details, {
            showOutput: true,
            showPopup: true,
          });
        } else {
          logger.error(`Emitting ${codeInfoStr}...Failed.`, [err], {
            showOutput: true,
            showPopup: true,
          });
        }
        telemetryClient.logOperationDetailTelemetry(tel.activityId, {
          emitResult: `Emitting code failed: ${inspect(err)}`,
        });
        return ResultCode.Fail;
      } finally {
        telemetryClient.logOperationDetailTelemetry(tel.activityId, {
          CompileEndTime: new Date().toISOString(), // ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
        });
      }
    },
  );
}

export async function emitCode(
  context: vscode.ExtensionContext,
  uri: vscode.Uri,
  tel: OperationTelemetryEvent,
): Promise<ResultCode> {
  if (!tspLanguageClient) {
    logger.error(
      `LSP client is not started. Make sure typespec compiler has been installed. Emitting Cancelled.`,
      [],
      {
        showOutput: true,
        showPopup: true,
      },
    );
    return ResultCode.Cancelled;
  }
  const isSupport = await isCompilerSupport(tspLanguageClient);
  if (!isSupport) {
    logger.info(
      "Compiling project via the language server is not supported in the current version of TypeSpec Compiler. Emitting Cancelled.",
    );
    tel.lastStep = "Check compiler capability";
    return ResultCode.Cancelled;
  }
  let tspProjectFile: string = "";
  if (!uri) {
    const targetPathes = await TraverseMainTspFileInWorkspace();
    logger.info(`Found ${targetPathes.length} ${StartFileName} files`);
    if (targetPathes.length === 0) {
      logger.info(`No entrypoint file (${StartFileName}) found. Emitting Cancelled.`, [], {
        showOutput: true,
        showPopup: true,
      });
      tel.lastStep = "Check entrypoint file without uri";
      return ResultCode.Cancelled;
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
        title: "Emit from TypeSpec",
        canPickMany: false,
        placeHolder: "Select a project",
        ignoreFocusOut: true,
      });
      if (!selectedProjectFile) {
        logger.info("No project selected. Emitting Cancelled.", [], {
          showOutput: true,
          showPopup: true,
        });
        tel.lastStep = "Select project for entrypoint";
        return ResultCode.Cancelled;
      }
      tspProjectFile = selectedProjectFile.path;
    }
  } else {
    const tspStartFile = await getEntrypointTspFile(uri.fsPath);
    if (!tspStartFile) {
      logger.info(`No entrypoint file (${StartFileName}). Invalid TypeSpec project.`, [], {
        showOutput: true,
        showPopup: true,
      });
      tel.lastStep = "Check entrypoint file with uri";
      return ResultCode.Cancelled;
    }
    tspProjectFile = tspStartFile;
  }

  logger.info(`Emit from entrypoint file: ${tspProjectFile}`);
  const baseDir = getDirectoryPath(tspProjectFile);
  const tspConfigFile = path.join(baseDir, TspConfigFileName);
  let configYaml = tryParseYaml(""); //generate a empty yaml
  if (await isFile(tspConfigFile)) {
    const content = await readFile(tspConfigFile);
    configYaml = tryParseYaml(content.toString()) ?? configYaml;
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
      picked: true,
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
          language: e,
          emitterKind: EmitterKind.Unknown,
          kind: vscode.QuickPickItemKind.Default,
        };
      }
    });
    const multipleSelectionSeparatorItem = {
      kind: vscode.QuickPickItemKind.Separator,
      info: undefined,
      label: "multiple selection",
      description: "Select multiple configured emitters for code emitting",
      package: "",
      fromConfig: false,
      picked: false,
    };

    const selectMultipleQuickPick = {
      label: "Select multiple emitters",
      description: "Select multiple configured emitters",
      picked: true,
      fromConfig: false,
      package: "",
      kind: vscode.QuickPickItemKind.Default,
      iconPath: new vscode.ThemeIcon("check-all"),
    };

    const separatorItem = {
      kind: vscode.QuickPickItemKind.Separator,
      info: undefined,
      description: "Choose another emitter for code emitting",
      package: "",
      fromConfig: false,
      picked: false,
    };
    const newEmitterQuickPickItem = {
      label: "Choose another emitter",
      description: "Choose another emitter for code emitting",
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
      multipleSelectionSeparatorItem,
      selectMultipleQuickPick,
      separatorItem,
      newEmitterQuickPickItem,
    );
    const existingEmittersSelector = vscode.window.createQuickPick<any>();
    existingEmittersSelector.items = allPickItems;
    existingEmittersSelector.title = `Emit from TypeSpec`;
    existingEmittersSelector.canSelectMany = false;
    existingEmittersSelector.placeholder = "Select emitters for code emitting";
    existingEmittersSelector.ignoreFocusOut = true;

    existingEmittersSelector.show();

    const selectedExistingEmitters = await new Promise<EmitQuickPickItem[]>((resolve) => {
      existingEmittersSelector.onDidAccept(async () => {
        const selectedItem = existingEmittersSelector.selectedItems[0];
        if (selectedItem === newEmitterQuickPickItem) {
          const newEmitter = await configureEmitter(context);
          if (!newEmitter) {
            resolve([]);
          } else {
            resolve([toEmitterQuickPickItem(newEmitter)]);
          }
        } else if (selectedItem === selectMultipleQuickPick) {
          const selectedItems = await vscode.window.showQuickPick(existingEmitterQuickPickItems, {
            title: "Emit from TypeSpec",
            canPickMany: true,
            placeHolder: "Select emitters",
            ignoreFocusOut: true,
          });
          if (selectedItems) {
            resolve(selectedItems);
          } else {
            resolve([]);
          }
        } else {
          resolve([...existingEmittersSelector.selectedItems]);
          existingEmittersSelector.hide();
        }
      });

      existingEmittersSelector.onDidHide(() => {
        if (existingEmittersSelector.selectedItems.length === 0) {
          resolve([]);
        }
        existingEmittersSelector.dispose();
      });
    });
    if (!selectedExistingEmitters || selectedExistingEmitters.length === 0) {
      logger.info("No emitter selected. Emitting Cancelled.");
      tel.lastStep = "Select emitters";
      return ResultCode.Cancelled;
    }
    logger.info(`Selected emitters: ${selectedExistingEmitters.map((e) => e.package).join(", ")}`);

    return await doEmit(
      tspProjectFile,
      selectedExistingEmitters.map(
        (e) =>
          getRegisterEmittersByPackage(e.package) ?? {
            package: e.package,
            language: e.package,
            kind: EmitterKind.Unknown,
          },
      ),
      tel,
    );
  } else {
    const selectedEmitter = await configureEmitter(context);
    logger.info(`Selected emitter: ${selectedEmitter?.package}`);
    if (selectedEmitter) {
      return await doEmit(tspProjectFile, [selectedEmitter], tel);
    } else {
      logger.info("No emitter selected. Emitting Cancelled.");
      tel.lastStep = "Select configured emitters";
      return ResultCode.Cancelled;
    }
  }
}

async function isCompilerSupport(client: TspLanguageClient): Promise<boolean> {
  if (
    client.initializeResult?.serverInfo?.version === undefined ||
    client.initializeResult?.customCapacities?.internalCompile !== true
  ) {
    logger.error(
      `Compiling project via the language server is not supported in the current version of TypeSpec Compiler (ver ${client.initializeResult?.serverInfo?.version ?? "<= 1.0.0"}). Please upgrade to a version later than 1.0.0 (by npm install @typespec/compiler) and try again.`,
      [],
      {
        showOutput: true,
        showPopup: true,
      },
    );
    return false;
  }
  return true;
}

function getConfigEntriesFromEmitterOptions(
  emitterOptions: Record<string, any>,
): Record<string, { value: string; comment: string }> {
  const configEntries: Record<string, { value: string; comment: string }> = {};
  if (!emitterOptions.properties) {
    return configEntries;
  }

  for (const [propertyName, propertySchema] of Object.entries(emitterOptions.properties)) {
    const {
      description = "",
      type,
      enum: enumValues,
      default: defaultValue,
    } = propertySchema as any;

    const commentParts: string[] = [];
    if (description) commentParts.push(description);
    if (type) commentParts.push(`Type: ${type}`);
    if (Array.isArray(enumValues)) commentParts.push(`Options: ${enumValues.join(", ")}`);
    const comment = commentParts.join(" ");

    let value = defaultValue;
    if (value === undefined) {
      // If there is no default value; provide default values according to the following implementations based on the type.
      switch (type) {
        case "string":
          value = `""`;
          break;
        case "int":
        case "number":
          value = `0`;
          break;
        case "object":
          value = `{}`;
          break;
        case "bool":
        case "boolean":
          value = `false`;
          break;
        case "array":
          value = `[]`;
          break;
      }
    }

    configEntries[propertyName] = { value, comment };
  }

  return configEntries;
}

async function generateAnnotatedYamlFile(
  configYaml: Document,
  packageName: string,
  baseDir: string,
): Promise<void> {
  try {
    const emitterOptions = await loadEmitterOptions(baseDir, packageName);
    if (emitterOptions === undefined) {
      logger.debug(
        `No emitter options schema found for package ${packageName}, skipping annotation generation`,
      );
      return;
    }

    const configEntries = getConfigEntriesFromEmitterOptions(emitterOptions);
    if (Object.keys(configEntries).length === 0) {
      logger.debug(`No configuration entries found for ${packageName}`);
      return;
    }

    const packageNodeOptions: { name: string; value: string; comment: string }[] = [];
    for (const [propertyName, propertyConfig] of Object.entries(configEntries)) {
      const { value, comment } = propertyConfig as { value: any; comment: string };
      packageNodeOptions.push({ name: propertyName, value, comment });
    }

    const parentMap = configYaml.getIn(["options", packageName], true) as any;
    if (parentMap) {
      const maxNameLength = Math.max(...packageNodeOptions.map((x) => x.name.length));
      const maxValueLength = Math.max(...packageNodeOptions.map((x) => String(x.value).length));
      const commentAlignmentSpacing = 10;
      parentMap.comment = packageNodeOptions
        .map((x) => {
          const nameValuePart = ` ${x.name}: ${x.value}`;
          const totalPadding = maxNameLength + maxValueLength + 3 + commentAlignmentSpacing; // 3 for ": " and space
          const currentLength = nameValuePart.length;
          const spacesToAdd = totalPadding - currentLength;
          return `${nameValuePart}${" ".repeat(spacesToAdd)}# ${x.comment}`;
        })
        .join("\n");
      configYaml.setIn(["options", packageName], parentMap);
    }
  } catch (error) {
    logger.error(`Error generating annotated yaml file content for ${packageName}:`, [error]);
  }
}
