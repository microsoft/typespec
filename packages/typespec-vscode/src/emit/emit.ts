import path from "path";
import vscode, { Uri } from "vscode";
import { Executable } from "vscode-languageclient/node.js";
import { StartFileName } from "../const.js";
import logger from "../log/logger.js";
import { InstallationAction, npmDependencyType, NpmUtil } from "../npm-utils.js";
import { getDirectoryPath } from "../path-utils.js";
import { resolveTypeSpecCli } from "../tsp-executable-resolver.js";
import {
  getEntrypointTspFile,
  onStdioError,
  onStdioOut,
  TraverseMainTspFileInWorkspace,
} from "../typespec-utils.js";
import { ExecOutput, isFile, spawnExecution } from "../utils.js";
import { EmitQuickPickItem } from "./emit-quick-pick-item.js";
import {
  Emitter,
  EmitterKind,
  getRegisterEmitters,
  getRegisterEmitterTypes,
  PreDefinedEmitterPickItems,
} from "./emitter.js";

export async function doEmit(
  context: vscode.ExtensionContext,
  mainTspFile: string,
  kind: EmitterKind,
) {
  if (!mainTspFile || !(await isFile(mainTspFile))) {
    logger.info(
      "Invalid typespec project. There is no main tsp file in the project. Generating Cancelled.",
      [],
      { showOutput: false, showPopup: true },
    );
    return;
  }

  const baseDir = getDirectoryPath(mainTspFile);

  const toQuickPickItem = (e: Emitter): EmitQuickPickItem => {
    return {
      language: e.language,
      package: e.package,
      emitterKind: e.kind,
      label: e.language,
      detail: `Generate ${e.language} ${e.kind} code from ${e.package}`,
      picked: false,
      fromConfig: false,
      iconPath: Uri.file(context.asAbsolutePath(`./icons/${e.language.toLowerCase()}.svg`)),
    };
  };

  const registerEmitters = getRegisterEmitters(kind);
  const all = [...registerEmitters].map((e) => toQuickPickItem(e));

  const selectedEmitter = await vscode.window.showQuickPick<EmitQuickPickItem>(all, {
    title: "Select a Language",
    canPickMany: false,
    placeHolder: "Pick a Language",
    ignoreFocusOut: true,
  });

  if (!selectedEmitter) {
    logger.info("No emitter selected. Generating Cancelled.", [], {
      showOutput: false,
      showPopup: false,
    });
    return;
  }

  logger.info("npm install...", [], {
    showOutput: false,
    showPopup: false,
  });

  const npmUtil = new NpmUtil(baseDir);
  const packagesToInstall: string[] = [];

  /* install emitter package. */
  logger.info(`select ${selectedEmitter.package}`);
  const { action, version } = await npmUtil.ensureNpmPackageInstallAction(
    selectedEmitter.package,
    selectedEmitter.version,
  );

  if (action === InstallationAction.Upgrade) {
    logger.info(`Upgrading ${selectedEmitter.package} to version ${version}`);
    const options = {
      ok: `OK (install ${selectedEmitter.package}@${version} by 'npm install'`,
      recheck: `Check again (install ${selectedEmitter.package} manually)`,
      ignore: `Ignore (don't upgrade emitter ${selectedEmitter.package})`,
    };
    const selected = await vscode.window.showQuickPick(Object.values(options), {
      canPickMany: false,
      ignoreFocusOut: true,
      placeHolder: `Package '${selectedEmitter.package}' needs to be upgraded for generating`,
      title: `TypeSpec Generating...`,
    });
    if (selected === options.ok) {
      packagesToInstall.push(`${selectedEmitter.package}@${version}`);
    } else if (selected === options.ignore) {
      logger.info(`Ignore upgrading emitter ${selectedEmitter.package} for generating`, [], {
        showOutput: false,
        showPopup: false,
      });
    } else {
      logger.info(
        `Need to manually install the package ${selectedEmitter.package}@${version}. Generating Cancelled.`,
        [],
        {
          showOutput: false,
          showPopup: true,
        },
      );
      return;
    }
  } else if (action === InstallationAction.Install) {
    let packageFullName = selectedEmitter.package;
    if (version) {
      packageFullName = `${selectedEmitter.package}@${version}`;
    }
    logger.info(`Installing ${packageFullName}`);
    /* verify dependency packages. */
    const dependenciesToInstall = await npmUtil.ensureNpmPackageDependencyToUpgrade(
      selectedEmitter.package,
      version,
      npmDependencyType.peerDependencies,
    );
    logger.info(`${dependenciesToInstall}`);
    if (dependenciesToInstall.length > 0) {
      vscode.window.showInformationMessage(
        `Need to manually upgrade following dependency packages: ${dependenciesToInstall.join("\\n")}. \nGenerating Cancelled`,
        "OK",
      );
      return;
    }
    packagesToInstall.push(`${packageFullName}`);
  }

  /* npm install packages. */
  if (packagesToInstall.length > 0) {
    logger.info(`Installing ${packagesToInstall.join("\n\n")} under ${baseDir}`, [], {
      showOutput: true,
      showPopup: true,
    });
    try {
      const npmInstallResult = await npmUtil.npmInstallPackages(packagesToInstall, undefined, {
        onStdioOut: onStdioOut,
        onStdioError: onStdioError,
      });
      if (npmInstallResult.exitCode !== 0) {
        logger.error(`Error occurred when installing packages.`, [`${npmInstallResult.stderr}`], {
          showOutput: true,
          showPopup: true,
        });
        return;
      }
      logger.info("completed install...");
    } catch (err) {
      logger.error(`Exception occurred when installing packages.`, [err], {
        showOutput: true,
        showPopup: true,
      });
      return;
    }
  }

  /* emit */
  logger.info("Generating ...", [], {
    showOutput: false,
    showPopup: false,
  });

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
  const outputDir = path.resolve(baseDir, selectedEmitter.emitterKind, selectedEmitter.language);

  const options: Record<string, string> = {};
  options["emitter-output-dir"] = outputDir;
  logger.info(
    `Start to generate ${selectedEmitter.language} ${selectedEmitter.emitterKind} code under ${outputDir}...`,
    [],
    {
      showOutput: true,
      showPopup: false,
    },
  );
  try {
    const compileResult = await compile(cli, mainTspFile, selectedEmitter.package, options);
    if (compileResult.exitCode !== 0) {
      logger.error(
        `Failed to generate ${selectedEmitter.emitterKind} code for ${selectedEmitter.language}.`,
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
  } catch (err) {
    logger.error(
      `Exception occurred when generating ${selectedEmitter.emitterKind} code for ${selectedEmitter.language}.`,
      [err],
      {
        showOutput: true,
        showPopup: true,
      },
    );
  }
}

export async function emitCode(context: vscode.ExtensionContext, uri: vscode.Uri) {
  let tspProjectFile: string = "";
  if (!uri) {
    const targetPathes = await TraverseMainTspFileInWorkspace();
    logger.info(`Found ${targetPathes.length} ${StartFileName} files`);
    if (targetPathes.length === 0) {
      logger.info("No main tsp file found. Generating Cancelled.", [], {
        showOutput: false,
        showPopup: true,
      });
      return;
    }
    const toProjectPickItem = (filePath: string): any => {
      return {
        label: filePath,
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
      title: "Select a TypeSpec Project",
      canPickMany: false,
      placeHolder: "Pick a project",
      ignoreFocusOut: true,
    });
    if (!selectedProjectFile) {
      logger.info("No project selected. Generating Cancelled.", [], {
        showOutput: false,
        showPopup: true,
      });
      return;
    }
    tspProjectFile = selectedProjectFile.path;
  } else {
    const tspStartFile = await getEntrypointTspFile(uri.fsPath);
    if (!tspStartFile) {
      logger.info("No main file. Invalid typespec project.", [], {
        showOutput: false,
        showPopup: true,
      });
      return;
    }
    tspProjectFile = tspStartFile;
  }

  logger.info(`Generate from entrypoint file: ${tspProjectFile}`, [], {
    showOutput: false,
    showPopup: false,
  });

  const emitterKinds = getRegisterEmitterTypes();
  const toEitTypeQuickPickItem = (kind: EmitterKind): any => {
    return {
      label: PreDefinedEmitterPickItems[kind]?.label ?? kind,
      detail: PreDefinedEmitterPickItems[kind]?.detail ?? `Generate ${kind} code from TypeSpec`,
      emitterKind: kind,
      iconPath: Uri.file(context.asAbsolutePath(`./icons/${kind.toLowerCase()}.svg`)),
    };
  };
  const codesToEmit = emitterKinds.map((kind) => toEitTypeQuickPickItem(kind));
  const codeType = await vscode.window.showQuickPick(codesToEmit, {
    title: "Select an Emitter Type",
    canPickMany: false,
    placeHolder: "Select an emitter type",
    ignoreFocusOut: true,
  });
  if (!codeType) {
    logger.info("No emitter Type selected. Generating Cancelled.", [], {
      showOutput: false,
      showPopup: false,
    });
    return;
  }
  await doEmit(context, tspProjectFile, codeType.emitterKind);
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

  return await spawnExecution(cli.command, args, getDirectoryPath(startFile), {
    onStdioOut: onStdioOut,
    onStdioError: onStdioError,
  });
}
