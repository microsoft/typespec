import path from "path";
import vscode, { Uri } from "vscode";
import { Executable } from "vscode-languageclient/node.js";
import { StartFileName } from "../../const.js";
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

  const toQuickPickItem = (e: Emitter): EmitQuickPickItem => {
    const moreDetail = e.sourceRepo ? `[**More Detail**](${e.sourceRepo})` : "";
    return {
      language: e.language,
      package: e.package,
      version: e.version,
      requisites: e.requisites,
      sourceRepo: e.sourceRepo,
      emitterKind: e.kind,
      label: e.language,
      detail: `Generate ${e.kind} code for ${e.language} by TypeSpec library ${e.package}.${moreDetail}`,
      picked: false,
      fromConfig: false,
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
  const all = [...registerEmitters].map((e) => toQuickPickItem(e));

  const selectedEmitter = await vscode.window.showQuickPick<EmitQuickPickItem>(all, {
    title: `Generate from TypeSpec`,
    canPickMany: false,
    placeHolder: `Select a Language for ${kind} code generation`,
    ignoreFocusOut: true,
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
        const moreDetail = selectedEmitter.sourceRepo
          ? `[**More Detail**](${selectedEmitter.sourceRepo})`
          : "";
        let packageFullName = selectedEmitter.package;
        if (version) {
          packageFullName = `${selectedEmitter.package}@${version}`;
        }
        packageQuickPickItems.push({
          label: `${selectedEmitter.package}`,
          detail: `TypeSpec library for emitting ${selectedEmitter.language} from TypeSpec files.${minimumRequisites} ${moreDetail}`,
          packageFullName: packageFullName,
          picked: true,
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
                detail: "Required for enabling the emitter library.",
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
    const selectedPackages = await vscode.window.showQuickPick(installPackageQuickPickItems, {
      title: "Generate from TypeSpec",
      canPickMany: true,
      placeHolder: "Here are libraries to install or update.",
      ignoreFocusOut: true,
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
              const details = [];
              if (npmInstallResult.stdout !== "") details.push(npmInstallResult.stdout);
              if (npmInstallResult.stderr !== "") details.push(npmInstallResult.stderr);
              if (npmInstallResult.error) details.push(npmInstallResult.error);
              logger.error(`Error occurred when installing packages.`, [details], {
                showOutput: true,
                showPopup: true,
              });
              return false;
            } else {
              return true;
            }
          } catch (err: any) {
            if (typeof err === "object" && "stdout" in err && "stderr" in err && `error` in err) {
              const execOutput = err as ExecOutput;
              const details = [];
              if (execOutput.stdout !== "") details.push(execOutput.stdout);
              if (execOutput.stderr !== "") details.push(execOutput.stderr);
              if (execOutput.error) details.push(execOutput.error);
              logger.error(`Exception occurred when installing packages.`, details, {
                showOutput: true,
                showPopup: true,
              });
            } else {
              logger.error(`Exception occurred when installing packages.`, [err], {
                showOutput: true,
                showPopup: true,
              });
            }
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
  const outputDir = path.join(
    baseDir,
    selectedEmitter.emitterKind,
    getLanguageAlias(selectedEmitter.language),
  );

  const options: Record<string, string> = {};
  options["emitter-output-dir"] = outputDir;
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
          const details = [];
          if (compileResult.stdout !== "") details.push(compileResult.stdout);
          if (compileResult.stderr !== "") details.push(compileResult.stderr);
          if (compileResult.error) details.push(compileResult.error);
          logger.error(
            `Generating ${selectedEmitter.emitterKind} code for ${selectedEmitter.language}...Failed`,
            [details],
            {
              showOutput: true,
              showPopup: true,
            },
          );
        } else {
          const details = [];
          if (compileResult.stdout !== "") details.push(compileResult.stdout);
          if (compileResult.stderr !== "") details.push(compileResult.stderr);
          if (compileResult.error) details.push(compileResult.error);
          logger.info(
            `Generating ${selectedEmitter.emitterKind} code for ${selectedEmitter.language}...Succeeded`,
            [details],
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
