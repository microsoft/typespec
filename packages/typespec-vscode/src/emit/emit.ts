// import { TypeSpecConfig } from "@typespec/compiler";
import path, { dirname } from "path";
import vscode, { Uri } from "vscode";
import { Executable } from "vscode-languageclient/node.js";
import { StartFileName } from "../const.js";
import logger from "../log/logger.js";
import { InstallationAction, npmDependencyType, NpmUtil } from "../npm-utils.js";
import {
  getMainTspFile,
  resolveTypeSpecCli,
  toError,
  toOutput,
  TraverseMainTspFileInWorkspace,
} from "../typespec-utils.js";
import { ExecOutput, isFile, spawnExecution } from "../utils.js";
import { EmitQuickPickItem, TypeSpecProjectPickItem } from "./emit-quick-pick-item.js";
import { Emitter, EmitterKind, getRegisterEmitters } from "./emitter.js";

export async function doEmit(
  context: vscode.ExtensionContext,
  mainTspFile: string,
  kind: EmitterKind,
  overallProgress: vscode.Progress<{ message?: string; increment?: number }>,
) {
  if (!mainTspFile || !(await isFile(mainTspFile))) {
    logger.info(
      "Invalid typespec project. There is no main tsp file in the project. Generating Cancelled.",
      [],
      { showOutput: false, showPopup: true, progress: overallProgress },
    );
    return;
  }

  const baseDir = dirname(mainTspFile);

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
      progress: overallProgress,
    });
    return;
  }

  /* TODO: verify the sdk runtime installation. */
  /* inform to install needed runtime. */
  const { valid, required } = await check(`${baseDir}/${StartFileName}`, selectedEmitter.package);
  if (!valid) {
    const toInstall = required.map((e) => e.name).join(", ");
    await vscode.window
      .showInformationMessage(
        `Please install the required runtime for the selected emitters\n\n. ${toInstall}`,
        "OK",
      )
      .then((selection) => {
        if (selection === "OK") {
          logger.info("Generating Cancelled.", [], {
            showOutput: false,
            showPopup: true,
            progress: overallProgress,
          });
        }
      });
    return;
  }

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
        progress: overallProgress,
      });
    } else {
      logger.info(
        `Need to manually install the package ${selectedEmitter.package}@${version}. Generating Cancelled.`,
        [],
        {
          showOutput: false,
          showPopup: true,
          progress: overallProgress,
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
    const dependenciesToInstall = await npmUtil.ensureNpmPackageDependencyInstall(
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
      progress: overallProgress,
    });
    try {
      const npmInstallResult = await npmUtil.npmInstallPackages(packagesToInstall, undefined, {
        onStdioOut: toOutput,
        onStdioError: toError,
      });
      if (npmInstallResult.exitCode !== 0) {
        logger.error(`Error occurred when installing packages.`, [`${npmInstallResult.stderr}`], {
          showOutput: true,
          showPopup: true,
          progress: overallProgress,
        });
        return;
      }
      logger.info("completed install...");
    } catch (err) {
      logger.error(`Exception occurred when installing packages.`, [err], {
        showOutput: true,
        showPopup: true,
        progress: overallProgress,
      });
      return;
    }
  }

  /* emit */
  logger.info("Generating ...", [], {
    showOutput: false,
    showPopup: false,
    progress: overallProgress,
  });

  const cli = await resolveTypeSpecCli(baseDir);
  if (!cli) {
    logger.error(
      "Cannot find TypeSpec CLI. Please install @typespec/compiler. Generating Cancelled.",
      [],
      {
        showOutput: true,
        showPopup: true,
        progress: overallProgress,
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
      progress: overallProgress,
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
          progress: overallProgress,
        },
      );
    } else {
      logger.info(
        `Generating ${selectedEmitter.emitterKind} code for ${selectedEmitter.language}...Succeeded`,
        [],
        {
          showOutput: true,
          showPopup: true,
          progress: overallProgress,
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
        progress: overallProgress,
      },
    );
  }

  /*TODO: build sdk. */
}

export async function emitCode(
  context: vscode.ExtensionContext,
  uri: vscode.Uri,
  overallProgress: vscode.Progress<{ message?: string; increment?: number }>,
) {
  let tspProjectFile: string = "";
  if (!uri) {
    const targetPathes = await TraverseMainTspFileInWorkspace();
    logger.info(`Found ${targetPathes.length} ${StartFileName} files`);
    if (targetPathes.length === 0) {
      logger.info("No main tsp file found. Generating Cancelled.", [], {
        showOutput: false,
        showPopup: true,
        progress: overallProgress,
      });
      return;
    }
    const toProjectPickItem = (filePath: string): TypeSpecProjectPickItem => {
      return {
        label: filePath,
        path: filePath,
        iconPath: {
          light: Uri.file(context.asAbsolutePath(`./icons/tsp-file.light.svg`)),
          dark: Uri.file(context.asAbsolutePath(`./icons/tsp-file.dark.svg`)),
        },
      };
    };
    const typespecProjectQuickPickItems: TypeSpecProjectPickItem[] = targetPathes.map((filePath) =>
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
        progress: overallProgress,
      });
      return;
    }
    tspProjectFile = selectedProjectFile.path;
  } else {
    const tspStartFile = await getMainTspFile(uri.fsPath);
    if (!tspStartFile) {
      logger.info("No main file. Invalid typespec project.", [], {
        showOutput: false,
        showPopup: true,
        progress: overallProgress,
      });
      return;
    }
    tspProjectFile = tspStartFile;
  }

  interface EmitTypeQuickPickItem extends vscode.QuickPickItem {
    emitterKind: EmitterKind;
  }

  const codesToEmit = [
    {
      label: "Protocol Schema",
      detail: "Generating Protocol schema (OpenAPI for example) from TypeSpec",
      iconPath: Uri.file(context.asAbsolutePath(`./icons/schema.svg`)),
      emitterKind: EmitterKind.Schema,
    },
    {
      label: "Client Code",
      detail: "Generating Client Code from TypeSpec.",
      iconPath: Uri.file(context.asAbsolutePath(`./icons/sdk.svg`)),
      emitterKind: EmitterKind.Client,
    },
    {
      label: "<PREVIEW> Server Stub",
      detail: "Generating Server Stub from TypeSpec",
      iconPath: Uri.file(context.asAbsolutePath(`./icons/serverstub.svg`)),
      emitterKind: EmitterKind.Server,
    },
  ];
  const codeType = await vscode.window.showQuickPick<EmitTypeQuickPickItem>(codesToEmit, {
    title: "Select an Emitter Type",
    canPickMany: false,
    placeHolder: "Select an emitter type",
    ignoreFocusOut: true,
  });
  if (!codeType) {
    logger.info("No emitter Type selected. Generating Cancelled.", [], {
      showOutput: false,
      showPopup: false,
      progress: overallProgress,
    });
    return;
  }
  await doEmit(context, tspProjectFile, codeType.emitterKind, overallProgress);
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

  return await spawnExecution(cli.command, args, dirname(startFile), {
    onStdioOut: toOutput,
    onStdioError: toError,
  });
}

export async function check(
  startFile: string,
  emitter: string,
): Promise<{
  valid: boolean;
  required: { name: string; version: string }[];
}> {
  /* TODO: check the runtime. */
  return { valid: true, required: [] };
}
