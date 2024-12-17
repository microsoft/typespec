// import { TypeSpecConfig } from "@typespec/compiler";
import path, { dirname } from "path";
import vscode, { Uri } from "vscode";
import { Executable } from "vscode-languageclient/node.js";
import logger from "../log/logger.js";
import { InstallationAction, npmDependencyType, NpmUtil } from "../npm-utils.js";
import {
  getMainTspFile,
  resolveTypeSpecCli,
  toError,
  toOutput,
  TraverseMainTspFileInWorkspace,
} from "../typespec-utils.js";
import { ExecOutput, isFile, promisifySpawn } from "../utils.js";
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
      "Invalid typespec project. There is no main tsp file in the project. Emit canceled.",
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
    title: "Select the Language",
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

  /* TODO: verify packages to install. */

  logger.info("npm install...", [], {
    showOutput: false,
    showPopup: false,
    progress: overallProgress,
  });

  const npmUtil = new NpmUtil(baseDir);
  const packagesToInstall: string[] = [];
  const packagesToVerify: { package: string; version?: string }[] = [];
  // packagesToVerify.push({ package: "@typespec/compiler" });
  /* install emitter package. */
  logger.info(`select ${selectedEmitter.package}`);
  packagesToVerify.push({ package: selectedEmitter.package, version: selectedEmitter.version });
  for (const p of packagesToVerify) {
    const { action, version } = await npmUtil.ensureNpmPackageInstall(p.package, p.version);
    /* TODO: check the dependent compiler version. */
    if (action === InstallationAction.Upgrade) {
      logger.info(`Upgrading ${p.package} to version ${version}`);
      const options = {
        ok: `OK (install ${p.package}@${version} by 'npm install'`,
        recheck: `Check again (install ${p.package} manually)`,
        ignore: `Ignore emitter ${p.package}`,
        cancel: "Cancel",
      };
      const selected = await vscode.window.showQuickPick(Object.values(options), {
        canPickMany: false,
        ignoreFocusOut: true,
        placeHolder: `Package '${p.package}' needs to be installed for emitting`,
        title: `TypeSpec Emit...`,
      });
      if (selected === options.ok) {
        packagesToInstall.push(`${p.package}@${version}`);
      }
    } else if (action === InstallationAction.Install) {
      let packageFullName = p.package;
      if (version) {
        packageFullName = `${p.package}@${version}`;
      }
      logger.info(`Installing ${packageFullName}`);
      /* verify dependency packages. */
      const dependenciesToInstall = await npmUtil.ensureNpmPackageDependencyInstall(
        p.package,
        version,
        npmDependencyType.peerDependencies,
      );
      logger.info(`${dependenciesToInstall}`);
      for (const dependency of dependenciesToInstall) {
        const options = {
          ok: `OK (Upgrade ${dependency} by 'npm install'`,
          recheck: `Check again (install ${p.package} manually)`,
          ignore: `Ignore emitter ${p.package}`,
          cancel: "Cancel",
        };
        const selected = await vscode.window.showQuickPick(Object.values(options), {
          canPickMany: false,
          ignoreFocusOut: true,
          placeHolder: `Package '${dependency}' needs to be upgraded for emitting`,
          title: `TypeSpec Emit...`,
        });
        if (selected === options.ok) {
          packagesToInstall.push(dependency);
        }
      }
      packagesToInstall.push(`${packageFullName}`);
    }
  }

  /* npm install packages. */
  if (packagesToInstall.length > 0) {
    logger.info(`Installing ${packagesToInstall.join("\n\n")}, baseDir: ${baseDir}`, [], {
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
  const outputDir = path.resolve(baseDir, selectedEmitter.emitterKind, selectedEmitter.language);

  const options: Record<string, string> = {};
  options["emitter-output-dir"] = outputDir;
  logger.info(
    `Generate ${selectedEmitter.language} ${selectedEmitter.emitterKind} code under ${outputDir}...`,
    [],
    {
      showOutput: true,
      showPopup: true,
      progress: overallProgress,
    },
  );
  const compileResult = await compile(cli, mainTspFile, selectedEmitter.package, options);
  if (compileResult.exitCode !== 0) {
    logger.error(
      `Failed to generate ${selectedEmitter.language} ${selectedEmitter.emitterKind} code.`,
      [],
      {
        showOutput: true,
        showPopup: true,
        progress: overallProgress,
      },
    );
  } else {
    logger.info(
      `complete generating ${selectedEmitter.language} ${selectedEmitter.emitterKind} code.`,
      [],
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
    logger.info(`Found ${targetPathes.length} main.tsp files`);
    if (targetPathes.length === 0) {
      logger.info("No main.tsp file found. Emit canceled.", [], {
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
      title: "Select TypeSpec Project",
      canPickMany: false,
      placeHolder: "Pick a project",
      ignoreFocusOut: true,
    });
    if (!selectedProjectFile) {
      logger.info("No project selected. Emit canceled.", [], {
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
      label: "Client SDK",
      detail: "Generate client SDK library from typespec.",
      iconPath: Uri.file(context.asAbsolutePath(`./icons/sdk.svg`)),
      emitterKind: EmitterKind.Client,
    },
    {
      label: "Server Stub",
      detail: "Generate server codes from typespec",
      iconPath: Uri.file(context.asAbsolutePath(`./icons/serverstub.svg`)),
      emitterKind: EmitterKind.Server,
    },
    {
      label: "Protocol Schema",
      detail: "Generate protocol schema (e.g. OpenAPI, Protobuf) from typespec",
      iconPath: Uri.file(context.asAbsolutePath(`./icons/schema.svg`)),
      emitterKind: EmitterKind.Schema,
    },
  ];
  const codeType = await vscode.window.showQuickPick<EmitTypeQuickPickItem>(codesToEmit, {
    title: "Emit Code",
    canPickMany: false,
    placeHolder: "Select an option",
    ignoreFocusOut: true,
  });
  if (!codeType) {
    logger.info("No emitters selected. Emit canceled.", [], {
      showOutput: false,
      showPopup: true,
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
  /* TODO: check the runtime. */
  return { valid: true, required: [] };
}
