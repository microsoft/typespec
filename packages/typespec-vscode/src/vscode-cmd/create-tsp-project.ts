import {
  type InitProjectConfig,
  type InitProjectTemplate,
  type InitProjectTemplateEmitterTemplate,
} from "@typespec/compiler";
import {
  InitTemplateSchema,
  makeScaffoldingConfig,
  NodeSystemHost,
  scaffoldNewProject,
} from "@typespec/compiler/internals";
import { Ajv } from "ajv";
import * as semver from "semver";
import { inspect } from "util";
import vscode, { ExtensionContext, QuickPickItem } from "vscode";
import pkgJson from "../../package.json" with { type: "json" };
import { ExtensionStateManager } from "../extension-state-manager.js";
import logger from "../log/logger.js";
import {
  getBaseFileName,
  getDirectoryPath,
  joinPaths,
  normalizePath,
  resolvePath,
} from "../path-utils.js";
import telemetryClient from "../telemetry/telemetry-client.js";
import { TelemetryEventName } from "../telemetry/telemetry-event.js";
import { Result, ResultCode, SettingName } from "../types.js";
import {
  checkAndConfirmEmptyFolder,
  confirm,
  selectFolder,
  tryExecuteWithUi,
} from "../ui-utils.js";
import {
  checkInstalledNpm,
  checkInstalledTspCli,
  createPromiseWithCancelAndTimeout,
  ExecOutput,
  isFile,
  isWhitespaceStringOrUndefined,
  spawnExecutionAndLogToOutput,
  tryParseJson,
  tryReadFile,
  tryReadFileOrUrl,
} from "../utils.js";

type InitTemplatesUrlSetting = {
  name: string;
  url: string;
};

type InitTemplateInfo = {
  source: string;
  sourceType: "compiler" | "config";
  baseUrl: string;
  name: string;
  template: InitProjectTemplate;
};

interface TemplateQuickPickItem extends QuickPickItem {
  info?: InitTemplateInfo;
}

interface EmitterQuickPickItem extends QuickPickItem {
  name: string;
  emitterTemplate: InitProjectTemplateEmitterTemplate;
}

const COMPILER_CORE_TEMPLATES = "compiler-core-templates";
const TITLE = "Create a TypeSpec project";
export async function createTypeSpecProject(
  context: ExtensionContext,
  stateManager: ExtensionStateManager,
) {
  await telemetryClient.doOperationWithTelemetry<ResultCode>(
    TelemetryEventName.CreateProject,
    async (tel, sendTelEvent): Promise<ResultCode> => {
      return await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          cancellable: false,
          title: "Creating TypeSpec Project...",
        },
        async (): Promise<ResultCode> => {
          const selectedRootFolder = await selectFolder(
            "Select Folder",
            "Select Project Folder as Root",
          );
          if (!selectedRootFolder) {
            logger.info("Creating TypeSpec Project cancelled when selecting project root folder.");
            tel.lastStep = "Select project root folder";
            return ResultCode.Cancelled;
          }

          if (
            !(await checkAndConfirmEmptyFolder(
              selectedRootFolder,
              "The folder selected is not empty. Are you sure you want to initialize a new project here?",
              TITLE,
            ))
          ) {
            logger.info(
              "Creating TypeSpec Project cancelled when checking whether the project root folder is empty.",
            );
            tel.lastStep = "Check empty project root folder";
            return ResultCode.Cancelled;
          }
          const folderName = getBaseFileName(selectedRootFolder);

          const templateInfoMap = await loadInitTemplates(context);
          if (templateInfoMap.size === 0) {
            logger.error(
              "Unexpected Error: No templates loaded. Please check the configuration of InitTemplatesUrls or upgrade @typespec/compiler and try again.",
              [],
              {
                showOutput: true,
                showPopup: true,
              },
            );
            telemetryClient.logOperationDetailTelemetry(tel.activityId, {
              error: "No templates loaded from compiler or config",
            });
            tel.lastStep = "Load templates";
            return ResultCode.Fail;
          }
          const info = await selectTemplate(templateInfoMap);
          if (info === undefined) {
            logger.info("Creating TypeSpec Project cancelled when selecting template.");
            tel.lastStep = "Select template";
            return ResultCode.Cancelled;
          } else {
            logger.info(`Selected template: ${info.source}.${info.name}`);
          }

          const validateResult = await validateTemplate(info);
          if (!validateResult) {
            logger.info("Creating TypeSpec Project cancelled when validating template.");
            tel.lastStep = "Validate template";
            return ResultCode.Cancelled;
          }

          const projectName = await vscode.window.showInputBox({
            prompt: "Please input the project name",
            value: folderName,
            ignoreFocusOut: true,
            validateInput: (value) => {
              if (isWhitespaceStringOrUndefined(value)) {
                return "Project name cannot be empty.";
              }
              // we don't have a full rule for project name. Just have a simple check to avoid some strange name.
              const regex = /^(?![./])(?!.*[./]{2})[a-zA-Z0-9-~_@./]*[a-zA-Z0-9-~_@]$/;
              if (!regex.test(value)) {
                return "Invalid project name. Only [a-zA-Z0-9-~_@./] are allowed and cannot start/end with [./] or consecutive [./]";
              }
              return undefined;
            },
          });
          if (isWhitespaceStringOrUndefined(projectName)) {
            logger.info("Creating TypeSpec Project cancelled, project name is blank");
            tel.lastStep = "Input project name";
            return ResultCode.Cancelled;
          }

          const selectedEmitters = await selectEmitters(info);
          if (selectedEmitters === undefined) {
            logger.info("Creating TypeSpec Project cancelled when selecting emitters.");
            tel.lastStep = "Select emitters";
            return ResultCode.Cancelled;
          }

          const inputs = await setInputs(info);
          if (inputs === undefined) {
            logger.info("Creating TypeSpec Project cancelled when setting inputs.");
            tel.lastStep = "Set inputs";
            return ResultCode.Cancelled;
          }

          const initTemplateConfig = makeScaffoldingConfig(info.template!, {
            baseUri: info.baseUrl,
            name: projectName!,
            directory: selectedRootFolder,
            parameters: inputs ?? {},
            emitters: selectedEmitters,
          });
          const initResult = await initProject(initTemplateConfig);
          if (initResult.code === ResultCode.Cancelled) {
            logger.info("Creating TypeSpec Project cancelled when initializing project.");
            tel.lastStep = "Initialize project";
            return ResultCode.Cancelled;
          } else if (initResult.code !== ResultCode.Success) {
            logger.error(
              "Failed to create TypeSpec Project. Please check previous logs for details.",
              [],
              {
                showOutput: true,
                showPopup: true,
              },
            );
            telemetryClient.logOperationDetailTelemetry(tel.activityId, {
              error:
                "initProject failed: \n" + inspect(initResult.details ?? "no detail error got"),
            });
            tel.lastStep = "Initialize project";
            return ResultCode.Fail;
          }

          const packageJsonPath = joinPaths(selectedRootFolder, "package.json");
          if (!(await isFile(packageJsonPath))) {
            logger.warning(
              "Skip installing dependencies since no package.json is found in the project folder.",
            );
          } else {
            const r = await installDependencies(selectedRootFolder);
            if (r.code === ResultCode.Cancelled) {
              logger.info("Installing dependencies cancelled.");
            } else if (r.code !== ResultCode.Success) {
              logger.warning(
                r.details === "skipped"
                  ? "Installing dependencies is skipped. Please check previous log for details"
                  : "Installing dependencies failed. Please check previous logs for details",
                [],
                {
                  showOutput: true,
                  showPopup: true,
                },
              );
              if (typeof r === "object" && "stderr" in r && typeof r.stderr === "string") {
                telemetryClient.logOperationDetailTelemetry(tel.activityId, {
                  error: r.stderr,
                });
              }
            }
          }

          type nextStepChoice = "Add to workspace" | "Open in New Window" | "Ignore";
          let nextStep: nextStepChoice = "Ignore";
          const normalizedRootFolder = normalizePath(selectedRootFolder);
          const isFolderOpenedInWorkspace =
            vscode.workspace.workspaceFolders?.find(
              (x) => normalizePath(x.uri.fsPath) === normalizedRootFolder,
            ) !== undefined;
          if (isFolderOpenedInWorkspace) {
            logger.info("Project folder is already opened in workspace.");
            nextStep = "Ignore";
          } else {
            logger.info("Project folder is not opened in workspace, ask user to add or open.");
            nextStep =
              (await vscode.window.showInformationMessage<nextStepChoice>(
                "Project created successfully! What would you like to do next?",
                "Add to workspace",
                "Open in New Window",
              )) ?? "Ignore";
          }

          const emitterMessage = Object.entries(selectedEmitters)
            .filter(([_k, e]) => !isWhitespaceStringOrUndefined(e.message))
            .map(([k, e]) => `\t${k}: \n\t\t${e.message}`)
            .join("\n");
          const popupMessage = isWhitespaceStringOrUndefined(emitterMessage)
            ? "Project created! You can now compile to generate artifacts from your TypeSpec\n"
            : `Project created! You can now compile to generate artifacts from your TypeSpec. Click the button below to review the message from emitters installed.\n`;

          // our extension will be reinitialized if user chooses to open a new window or add to workspace with 0 or 1 folder
          // so send telemetry explicitly here before the next step
          tel.lastStep = `Next step: ${nextStep}`;
          // send in delay mode for "Open in New Window" and "Add to workspace" to avoid telemetry lost when the extension is reinitialized
          sendTelEvent(ResultCode.Success, nextStep === "Ignore" ? false : true /*delay*/);

          if (nextStep === "Open in New Window") {
            stateManager.saveStartUpMessage(
              {
                popupMessage,
                detail: emitterMessage,
                level: isWhitespaceStringOrUndefined(emitterMessage) ? "info" : "warn",
              },
              selectedRootFolder,
            );
            vscode.commands.executeCommand(
              "vscode.openFolder",
              vscode.Uri.file(selectedRootFolder),
              {
                forceNewWindow: false,
                forceReuseWindow: true,
                noRecentEntry: false,
              },
            );
          } else {
            logger.info(
              `Creating TypeSpec Project completed successfully in ${selectedRootFolder}.`,
            );
            // make sure this is the last one to log so that user can find the message easily to review
            logger.log(
              isWhitespaceStringOrUndefined(emitterMessage) ? "info" : "warn",
              popupMessage,
              [emitterMessage],
              {
                showPopup: true,
                popupButtonText: isWhitespaceStringOrUndefined(emitterMessage)
                  ? ""
                  : "View Details in Output",
              },
            );

            if (nextStep === "Add to workspace") {
              vscode.workspace.updateWorkspaceFolders(
                vscode.workspace.workspaceFolders?.length ?? 0,
                null,
                {
                  uri: vscode.Uri.file(selectedRootFolder),
                },
              );
            } else {
              tel.lastStep = "Ignore next step";
            }
          }
          return ResultCode.Success;
        },
      );
    },
  );
}

async function selectEmitters(
  info: InitTemplateInfo,
): Promise<Record<string, InitProjectTemplateEmitterTemplate> | undefined> {
  if (!info.template.emitters || typeof info.template.emitters !== "object") {
    return {};
  }

  const emitterList: EmitterQuickPickItem[] = Object.entries(info.template.emitters).map(
    ([name, emitter]) => {
      return {
        label: emitter.label ?? name,
        detail: emitter.label ? name : undefined,
        name: name,
        description: emitter.description,
        picked: emitter.selected,
        emitterTemplate: emitter,
      };
    },
  );
  if (emitterList.length === 0) {
    return {};
  }

  const selectedEmitters = await vscode.window.showQuickPick<EmitterQuickPickItem>(emitterList, {
    title: "Select emitters?",
    canPickMany: true,
    placeHolder: "Select emitters?",
    ignoreFocusOut: true,
  });

  if (!selectedEmitters) {
    return undefined;
  }

  return Object.fromEntries(selectedEmitters.map((x) => [x.name, x.emitterTemplate]));
}

async function installDependencies(directory: string): Promise<Result<ExecOutput | undefined>> {
  logger.info("Installing project dependencies");
  const checkTspCliPromise = checkInstalledTspCli();
  const checkNpmPromise = checkInstalledNpm();
  const [checkTspCli, checkNpm] = await Promise.all([checkTspCliPromise, checkNpmPromise]);
  if (checkTspCli || checkNpm) {
    return await tryExecuteWithUi(
      {
        name: "Installing project dependencies",
        progress: {
          timeoutInMs: 5 * 60 * 1000, // 5 minutes
          title: "Installing project dependencies",
          withCancelAndTimeout: true,
        },
      },
      async (progress) => {
        if (checkTspCli) {
          logger.info("tsp cli is installed, try to install dependencies with tsp install");
          progress?.report({ message: "running 'tsp install' ..." });
          try {
            return await spawnExecutionAndLogToOutput("tsp", ["install"], directory);
          } catch (e) {
            if (checkNpm) {
              logger.warning("tsp install failed. Try to install dependencies with npm.");
              progress?.report({ message: "running 'npm install' ..." });
              return await spawnExecutionAndLogToOutput("npm", ["install"], directory);
            } else {
              throw e;
            }
          }
        } else {
          logger.info("npm is installed, try to install dependencies with 'npm install'");
          progress?.report({ message: "running 'npm install' ..." });
          return await spawnExecutionAndLogToOutput("npm", ["install"], directory);
        }
      },
    );
  } else {
    logger.warning(
      "Installing dependencies is skipped because neither TypeSpec CLI(tsp) nor npm is found. You can install dependencies manually by:\n" +
        "  1. Install nodejs and npm from https://nodejs.org/ and then run 'npm install' from the project folder. OR\n" +
        "  2. Install TypeSpec CLI(tsp) from https://typespec.io/docs/ and then run 'tsp install' from the project folder.",
    );
    return { code: ResultCode.Fail, details: "skipped" };
  }
}

async function initProject(initTemplateConfig: InitProjectConfig): Promise<Result> {
  return await tryExecuteWithUi(
    {
      name: "initializing new project",
      progress: {
        withCancelAndTimeout: true,
        timeoutInMs: 5 * 60 * 1000, // 5 minutes
        title: "Creating TypeSpec project...",
      },
    },
    async () => {
      await scaffoldNewProject(NodeSystemHost, initTemplateConfig);
      logger.info("Creating TypeSpec project completed.");
    },
  );
}

function isTemplateVersionCompatible(info: InitTemplateInfo): boolean {
  if (info.sourceType === "compiler") {
    return true;
  }
  const compilerVersion = pkgJson.version;
  const templateRequiredVersion = info.template.compilerVersion;
  return (
    !compilerVersion ||
    !templateRequiredVersion ||
    semver.gte(compilerVersion, templateRequiredVersion)
  );
}

async function validateTemplate(info: InitTemplateInfo): Promise<boolean> {
  if (info.sourceType === "compiler") {
    // no need to validate template from compiler
    return true;
  }

  if (!isTemplateVersionCompatible(info)) {
    const compilerVersion = pkgJson.version;
    const templateRequiredVersion = info.template.compilerVersion;
    logger.warning(
      `The selected template is designed for tsp version ${templateRequiredVersion}, but currently using tsp version is ${compilerVersion}.`,
    );
    const cont = await confirm({
      title: TITLE,
      placeholder:
        `Current tsp version (${compilerVersion}) < template designed tsp version(${templateRequiredVersion}). ` +
        `The project created may not be correct. Do you want to continue?`,
    });
    if (!cont) {
      logger.info(
        "User confirmed/cancelled creating TypeSpec Project due to template version mismatch.",
      );
      return false;
    }
  }

  const ajv = new Ajv({ strict: false, allErrors: true });
  const validateFunc = ajv.compile(InitTemplateSchema);
  const validateResult: boolean = await validateFunc(info.template);

  if (!validateResult) {
    logger.warning("Template validation failed: \n", [inspect(validateFunc.errors)], {
      showOutput: true,
      showPopup: true,
    });
    const cont = await confirm({
      title: TITLE,
      placeholder:
        "Template validation failed. Do you want to continue? Detail log can be found in the Output window.",
    });
    if (!cont) {
      logger.info("Creating TypeSpec Project cancelled due to template validation failure.");
      return false;
    }
  }
  return true;
}

async function setInputs(info: InitTemplateInfo): Promise<Record<string, string> | undefined> {
  const inputs: Record<string, string> = {};
  for (const [key, input] of Object.entries(info.template?.inputs ?? {})) {
    switch (input.type) {
      case "text":
        const textInput = await vscode.window.showInputBox({
          prompt: input.description,
          value: input.initialValue,
          ignoreFocusOut: true,
        });
        if (textInput === undefined) {
          logger.info(`No input provided for ${key}.`);
          return undefined;
        }
        inputs[key] = textInput;
        break;
      default:
        logger.error(
          `Input type ${input.type} in the template is not supported. Please upgrade the extension and try again.`,
          [],
          {
            showOutput: true,
            showPopup: true,
          },
        );
        return undefined;
    }
  }
  return inputs;
}

async function selectTemplate(
  templateInfoMap: Map<string, InitTemplateInfo[]>,
): Promise<InitTemplateInfo | undefined> {
  const templatePickupItems: TemplateQuickPickItem[] = [];
  const toPickupItems = (x: InitTemplateInfo): TemplateQuickPickItem => {
    let label = x.template.title ?? x.name;
    if (!isTemplateVersionCompatible(x)) {
      label += ` (Requires tsp version ${x.template.compilerVersion})`;
    }
    return {
      label,
      detail: x.template.description,
      kind: vscode.QuickPickItemKind.Default,
      info: x,
    };
  };
  // Templates from compiler should always be on the top
  templateInfoMap.get(COMPILER_CORE_TEMPLATES)?.forEach((x) => {
    templatePickupItems.push(toPickupItems(x));
  });
  for (const key of templateInfoMap.keys()) {
    if (key === COMPILER_CORE_TEMPLATES) {
      continue;
    }
    const temps = [];
    for (const info of templateInfoMap.get(key) ?? []) {
      if (!info || !info.template) {
        logger.warning(`Template ${info.name} in ${key} is empty. Skip it.`);
        continue;
      }
      temps.push(toPickupItems(info));
    }
    if (temps.length > 0) {
      templatePickupItems.push({
        label: key,
        kind: vscode.QuickPickItemKind.Separator,
      });
      templatePickupItems.push(...temps);
    }
  }
  templatePickupItems.push({
    label: "Settings",
    kind: vscode.QuickPickItemKind.Separator,
    info: undefined,
  });
  const configureSettingsItem: TemplateQuickPickItem = {
    label: "Configure TypeSpec Project Templates",
    kind: vscode.QuickPickItemKind.Default,
    info: undefined,
    buttons: [
      {
        iconPath: new vscode.ThemeIcon("settings-gear"),
        tooltip: "Configure TypeSpec Project Templates",
      },
    ],
  };
  templatePickupItems.push(configureSettingsItem);
  const quickPickup = vscode.window.createQuickPick<TemplateQuickPickItem>();
  quickPickup.items = templatePickupItems;
  quickPickup.canSelectMany = false;
  quickPickup.ignoreFocusOut = true;
  quickPickup.title = TITLE;
  quickPickup.placeholder = "Please select a template";
  const gotoConfigSettings = () => {
    logger.info("User select to open settings to configure TypeSpec Project Templates");
    quickPickup.hide();
    vscode.commands.executeCommand("workbench.action.openSettings", SettingName.InitTemplatesUrls);
  };
  quickPickup.onDidTriggerItemButton((event) => {
    if (event.item === configureSettingsItem) {
      gotoConfigSettings();
    }
  });
  const selectionPromise = new Promise<TemplateQuickPickItem | undefined>((resolve) => {
    quickPickup.onDidAccept(() => {
      const selectedItem = quickPickup.selectedItems[0];
      resolve(selectedItem);
      quickPickup.hide();
    });
    quickPickup.onDidHide(() => {
      resolve(undefined);
      quickPickup.dispose();
    });
  });
  quickPickup.show();

  const selected = await selectionPromise;
  if (configureSettingsItem === selected) {
    gotoConfigSettings();
    return undefined;
  }
  return selected?.info;
}

async function getTypeSpecCoreTemplates(
  context: ExtensionContext,
): Promise<{ readonly baseUri: string; readonly templates: Record<string, any> } | undefined> {
  const templatesDir = context.asAbsolutePath("templates");
  const file = await tryReadFile(resolvePath(templatesDir, "scaffolding.json"));
  if (file) {
    const content = tryParseJson(file);
    return {
      baseUri: templatesDir,
      templates: content,
    };
  } else {
    logger.error(`Failed to read core typespec templates from extension: ${templatesDir}`);
    return undefined;
  }
}

async function loadInitTemplates(
  context: ExtensionContext,
): Promise<Map<string, InitTemplateInfo[]>> {
  const templateInfoMap: Map<string, InitTemplateInfo[]> = new Map();
  logger.info("Loading init templates from compiler...");
  const templates = await getTypeSpecCoreTemplates(context);
  if (templates !== undefined) {
    templateInfoMap.set(
      COMPILER_CORE_TEMPLATES,
      Object.entries(templates.templates)
        .filter(([_key, value]) => value !== undefined)
        .map(([key, value]) => ({
          source: COMPILER_CORE_TEMPLATES,
          sourceType: "compiler",
          baseUrl: templates.baseUri,
          name: key,
          template: value,
        })),
    );
  }
  const settings = vscode.workspace
    .getConfiguration()
    .get<InitTemplatesUrlSetting[]>(SettingName.InitTemplatesUrls);
  if (settings) {
    logger.info("Loading init templates from config...");
    const loadFromConfig = async () => {
      for (const item of settings) {
        const { content, url } = (await tryReadFileOrUrl(item.url)) ?? {
          content: undefined,
          url: item.url,
        };
        if (!content) {
          logger.warning(`Failed to read template from ${item.url}. The url will be skipped`, [], {
            showOutput: false,
            showPopup: true,
          });
          continue;
        } else {
          const json = tryParseJson(content);
          if (!json) {
            logger.warning(
              `Failed to parse templates content from ${item.url}. The url will be skipped`,
              [],
              { showOutput: false, showPopup: true },
            );
            continue;
          } else {
            for (const [key, value] of Object.entries(json)) {
              if (value !== undefined) {
                const info: InitTemplateInfo = {
                  source: item.name,
                  sourceType: "config",
                  baseUrl: getDirectoryPath(url),
                  name: key,
                  template: value as InitProjectTemplate,
                };
                templateInfoMap.get(item.name)?.push(info) ??
                  templateInfoMap.set(item.name, [info]);
              }
            }
          }
        }
      }
    };
    // this may take long time if the network is slow or broken
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Loading init templates from config...",
        cancellable: true,
      },
      async (_progress, token) => {
        await createPromiseWithCancelAndTimeout(
          loadFromConfig(),
          token,
          5 * 60 * 1000, // 5 minutes as timeout
        );
      },
    );
  }
  logger.info(`${templateInfoMap.size} templates loaded.`);
  return templateInfoMap;
}
