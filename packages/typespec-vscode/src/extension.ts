import path, { dirname } from "path";
import vscode, { commands, ExtensionContext } from "vscode";
import { SettingName } from "./const.js";
import { compile } from "./emit/emit-code.js";
import { EmitPackageQuickPickItem, recommendedEmitters } from "./emit/emitters.js";
import { ExtensionLogListener } from "./log/extension-log-listener.js";
import logger from "./log/logger.js";
import { TypeSpecLogOutputChannel } from "./log/typespec-log-output-channel.js";
import { InstallationAction, NpmUtil } from "./npm-utils.js";
import { createTaskProvider } from "./task-provider.js";
import { TspLanguageClient } from "./tsp-language-client.js";
import { isFile } from "./utils.js";

let client: TspLanguageClient | undefined;
/**
 * Workaround: LogOutputChannel doesn't work well with LSP RemoteConsole, so having a customized LogOutputChannel to make them work together properly
 * More detail can be found at https://github.com/microsoft/vscode-discussions/discussions/1149
 */
const outputChannel = new TypeSpecLogOutputChannel("TypeSpec");
logger.registerLogListener("extension-log", new ExtensionLogListener(outputChannel));

export async function activate(context: ExtensionContext) {
  context.subscriptions.push(createTaskProvider());

  context.subscriptions.push(
    commands.registerCommand("typespec.showOutputChannel", () => {
      outputChannel.show(true /*preserveFocus*/);
    }),
  );

  context.subscriptions.push(
    commands.registerCommand("typespec.restartServer", async () => {
      if (client) {
        await client.restart();
      }
    }),
  );

  /* code generation command. */
  context.subscriptions.push(
    commands.registerCommand("typespec.GenerateSDK", async (uri: vscode.Uri) => {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: "TypeSpec Gerating SDK...",
          cancellable: false,
        },
        async (progress) => await doEmit(context, uri, progress),
      );
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e: vscode.ConfigurationChangeEvent) => {
      if (e.affectsConfiguration(SettingName.TspServerPath)) {
        logger.info("TypeSpec server path changed, restarting server...");
        const oldClient = client;
        client = await TspLanguageClient.create(context, outputChannel);
        await oldClient?.stop();
        await client.start();
      }
    }),
  );

  vscode.tasks.registerTaskProvider("Typespec.GenerateSdk", {
    provideTasks: () => {
      return generatSdkTask();
    },
    resolveTask(_task: vscode.Task): vscode.Task | undefined {
      return undefined;
    },
  });

  return await vscode.window.withProgress(
    {
      title: "Launching TypeSpec language service...",
      location: vscode.ProgressLocation.Notification,
    },
    async () => {
      client = await TspLanguageClient.create(context, outputChannel);
      await client.start();
    },
  );
}

export async function deactivate() {
  await client?.stop();
}

function generatSdkTask(): vscode.Task[] {
  let task = new vscode.Task(
    { type: "Typespec.GenerateSdk" },
    vscode.TaskScope.Workspace,
    "Generate Sdk",
    "generate sdk",
    new vscode.ShellExecution("echo Hello World"),
  );
  return [task];
}

export async function doEmit(
  context: vscode.ExtensionContext,
  uri: vscode.Uri,
  overallProgress: vscode.Progress<{ message?: string; increment?: number }>,
) {
  const baseDir = (await isFile(uri.fsPath)) ? dirname(uri.fsPath) : uri.fsPath;
  logger.info("Collecting emitters...", [], {
    showOutput: false,
    showPopup: false,
    progress: overallProgress,
  });
  const recommended: EmitPackageQuickPickItem[] = [...recommendedEmitters];
  const toQuickPickItem = (
    language: string,
    packageName: string,
    picked: boolean,
    fromConfig: boolean,
  ): EmitPackageQuickPickItem => {
    const found = recommended.findIndex((ke) => ke.package === packageName);
    if (found >= 0) {
      const deleted = recommended.splice(found, 1);
      deleted[0].picked = picked;
      return { ...deleted[0], ...{ picked, fromConfig } };
    } else {
      return { language: language, package: packageName, label: packageName, picked, fromConfig };
    }
  };
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
  let selectedEmitters = await vscode.window.showQuickPick<EmitPackageQuickPickItem>(all, {
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

  /* TODO: verify packages to install. */

  /* TODO: verify the sdk runtime installation. */

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
    const { action, version } = npmUtil.ensureNpmPackageInstall(e.package, e.version);
    if (action === InstallationAction.Upgrade) {
      logger.info(`Upgrading ${e.package} to version ${version}`);
      const options = {
        ok: `OK (install ${e.package} by 'npm install'`,
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
      logger.info(`Installing ${e.package} version ${version}`, [], {
        showOutput: true,
        showPopup: true,
        progress: overallProgress,
      });
      logger.info(`Installing ${e.package} version ${version}`);
      packagesToInstall.push(`${e.package}@${version}`);
    }
    // let packageFullName = e.package;
    // if (e.version) {
    //   packageFullName = `${e.package}@${e.version}`;
    // }

    // packagesToInstall.push(packageFullName);
  }

  /* npm install packages. */
  await npmUtil.npmInstallPackages(packagesToInstall);
  // await npmInstallPackages(packagesToInstall, { cwd: baseDir });

  /* emit */
  logger.info("start to emit code...");
  logger.info("Emit code ...", [], {
    showOutput: false,
    showPopup: false,
    progress: overallProgress,
  });
  const startFile = `${baseDir}/main.tsp`;
  const compileCommand = "npx tsp";
  for (const e of selectedEmitters) {
    /*TODO: add a dialog to config output dir. */
    const outputDir = path.resolve(baseDir, "tsp-output", e.language);
    await compile(compileCommand, startFile, e.package, outputDir);
    logger.info(`complete generating ${e.language} SDK.`);

    /*TODO: build sdk. */
  }
}
