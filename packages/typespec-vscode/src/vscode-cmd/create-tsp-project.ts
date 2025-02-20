import {
  type InitProjectConfig,
  type InitProjectTemplate,
  type InitProjectTemplateEmitterTemplate,
  type InitProjectTemplateLibrarySpec,
} from "@typespec/compiler";
import {
  getTypeSpecCoreTemplates,
  NodeSystemHost,
  scaffoldNewProject,
} from "@typespec/compiler/internals/init";
import { readdir } from "fs/promises";
import * as semver from "semver";
import vscode, { OpenDialogOptions, QuickPickItem } from "vscode";
import { ExtensionStateManager } from "../extension-state-manager.js";
import logger from "../log/logger.js";
import { getBaseFileName, getDirectoryPath, joinPaths, normalizePath } from "../path-utils.js";
import { ResultCode, SettingName } from "../types.js";
import {
  createPromiseWithCancelAndTimeout,
  ExecOutput,
  isFile,
  isWhitespaceStringOrUndefined,
  tryParseJson,
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

interface LibraryQuickPickItem extends QuickPickItem {
  name: string;
  version?: string;
}

interface EmitterQuickPickItem extends QuickPickItem {
  name: string;
  emitterTemplate: InitProjectTemplateEmitterTemplate;
}

const COMPILER_CORE_TEMPLATES = "compiler-core-templates";
const TITLE = "Create a TypeSpec project";
export async function createTypeSpecProject(stateManager: ExtensionStateManager) {
  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      cancellable: false,
      title: "Creating TypeSpec Project...",
    },
    async () => {
      const selectedRootFolder = await selectProjectRootFolder();
      if (!selectedRootFolder) {
        logger.info("Creating TypeSpec Project cancelled when selecting project root folder.");
        return;
      }
      if (!(await checkProjectRootFolderEmpty(selectedRootFolder))) {
        logger.info(
          "Creating TypeSpec Project cancelled when checking whether the project root folder is empty.",
        );
        return;
      }
      const folderName = getBaseFileName(selectedRootFolder);

      const templateInfoMap = await loadInitTemplates();
      if (templateInfoMap.size === 0) {
        logger.error(
          "Unexpected Error: No templates loaded. Please check the configuration of InitTemplatesUrls or upgrade @typespec/compiler and try again.",
          [],
          {
            showOutput: true,
            showPopup: true,
          },
        );
        return;
      }
      const info = await selectTemplate(templateInfoMap);
      if (info === undefined) {
        logger.info("Creating TypeSpec Project cancelled when selecting template.");
        return;
      } else {
        logger.info(`Selected template: ${info.source}.${info.name}`);
      }

      const validateResult = await validateTemplate(info);
      if (!validateResult) {
        logger.info("Creating TypeSpec Project cancelled when validating template.");
        return;
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
        logger.info("Creating TypeSpec Project cancelled when input project name.", [], {
          showOutput: false,
          showPopup: false,
        });
        return;
      }

      const includeGitignoreResult = await vscode.window.showQuickPick(["Yes", "No"], {
        title: TITLE,
        canPickMany: false,
        placeHolder: "Do you want to generate a .gitignore file",
        ignoreFocusOut: true,
      });
      if (includeGitignoreResult === undefined) {
        logger.info(
          "Creating TypeSpec Project cancelled when selecting whether to include .gitignore.",
        );
        return;
      }
      const includeGitignore = includeGitignoreResult === "Yes";

      const librariesToInclude = await selectLibraries(info);
      if (librariesToInclude === undefined) {
        logger.info("Creating TypeSpec Project cancelled when selecting libraries to include.");
        return;
      }

      const selectedEmitters = await selectEmitters(info);
      if (selectedEmitters === undefined) {
        logger.info("Creating TypeSpec Project cancelled when selecting emitters.");
        return;
      }

      const inputs = await setInputs(info);
      if (inputs === undefined) {
        logger.info("Creating TypeSpec Project cancelled when setting inputs.");
        return;
      }

      const initTemplateConfig: InitProjectConfig = {
        template: info.template!,
        directory: selectedRootFolder,
        folderName: folderName,
        baseUri: info.baseUrl,
        name: projectName!,
        parameters: inputs ?? {},
        includeGitignore: includeGitignore,
        libraries: librariesToInclude,
        emitters: selectedEmitters,
      };
      const initResult = await initProject(initTemplateConfig);
      if (!initResult) {
        logger.info("Creating TypeSpec Project cancelled when initializing project.", [], {
          showOutput: false,
          showPopup: false,
        });
        return;
      }

      const packageJsonPath = joinPaths(selectedRootFolder, "package.json");
      if (!(await isFile(packageJsonPath))) {
        logger.warning("Skip tsp install since no package.json is found in the project folder.");
      } else {
        // just ignore the result from tsp install. We will open the project folder anyway.
        await tspInstall(selectedRootFolder);
      }

      const msg = Object.entries(selectedEmitters)
        .filter(([_k, e]) => !isWhitespaceStringOrUndefined(e.message))
        .map(([k, e]) => `\t${k}: \n\t\t${e.message}`)
        .join("\n");

      if (!isWhitespaceStringOrUndefined(msg)) {
        const p = normalizePath(selectedRootFolder);
        if (
          vscode.workspace.workspaceFolders?.find((x) => normalizePath(x.uri.fsPath) === p) ===
          undefined
        ) {
          // if the folder is not opened as workspace, persist the message to extension state because
          // openProjectFolder will reinitialize the extension.
          stateManager.saveStartUpMessage(
            {
              popupMessage:
                "Please review the message from emitters when creating TypeSpec Project",
              detail: msg,
              level: "warn",
            },
            selectedRootFolder,
          );
        } else {
          logger.warning("Please review the message from emitters\n", [msg], {
            showPopup: true,
            notificationButtonText: "Review in Output",
          });
        }
      }

      vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(selectedRootFolder), {
        forceNewWindow: false,
        forceReuseWindow: true,
        noRecentEntry: false,
      });
      logger.info(`Creating TypeSpec Project completed successfully in ${selectedRootFolder}.`);
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
        label: emitter.version ? `${name} (ver: ${emitter.version})` : name,
        name: name,
        detail: emitter.description,
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

async function tspInstall(directory: string): Promise<ExecOutput | undefined> {
  logger.info("Installing TypeSpec project dependencies by 'tsp install'...");
  return await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Installing TypeSpec project dependencies by 'tsp install'...",
      cancellable: true,
    },
    async (_progress, token) => {
      const TIMEOUT = 600000; // set timeout to 10 minutes which should be enough for tsp install for a new project
      try {
        const result = await createPromiseWithCancelAndTimeout(
          // client.runCliCommand(["install"], directory),
          Promise.resolve(undefined), // todo: implement tsp install
          token,
          TIMEOUT,
        );
        return result;
      } catch (e) {
        if (e === ResultCode.Cancelled) {
          logger.info(
            "Installation of TypeSpec project dependencies by 'tsp install' is cancelled by user",
          );
          return undefined;
        } else if (e === ResultCode.Timeout) {
          logger.error(
            `Installation of TypeSpec project dependencies by 'tsp install' is timeout after ${TIMEOUT}ms`,
          );
          return undefined;
        } else {
          logger.error(
            "Unexpected error when installing TypeSpec project dependencies by 'tsp install'",
            [e],
          );
          return undefined;
        }
      }
    },
  );
}

async function initProject(initTemplateConfig: InitProjectConfig): Promise<boolean> {
  return await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Creating TypeSpec project...",
      cancellable: true,
    },
    async (_progress, token) => {
      const TIMEOUT = 300000; // set timeout to 5 minutes which should be enough for init project
      try {
        await createPromiseWithCancelAndTimeout(
          scaffoldNewProject(NodeSystemHost, initTemplateConfig),
          token,
          TIMEOUT,
        );
        // if (!result) {
        //   logger.error(
        //     "Failed to create TypeSpec project. Please check the previous log for details.",
        //     [],
        //     {
        //       showOutput: true,
        //       showPopup: true,
        //     },
        //   );
        //   return false;
        // }
        logger.info("Creating TypeSpec project completed. ");
        return true;
      } catch (e) {
        if (e === ResultCode.Cancelled) {
          logger.info("Creating TypeSpec project cancelled by user.");
        } else if (e === ResultCode.Timeout) {
          logger.error(`Creating TypeSpec project timed out (${TIMEOUT}ms).`);
        } else {
          logger.error("Error when creating TypeSpec project", [e], {
            showOutput: true,
            showPopup: true,
          });
        }
        return false;
      }
    },
  );
}

async function validateTemplate(info: InitTemplateInfo): Promise<boolean> {
  if (info.sourceType === "compiler") {
    // no need to validate template from compiler
    return true;
  }

  const compilerVersion = vscode.extensions.getExtension("typespec.typespec")?.packageJSON.version;
  const templateRequiredVersion = info.template.compilerVersion;
  if (
    compilerVersion &&
    templateRequiredVersion &&
    semver.lt(compilerVersion, templateRequiredVersion)
  ) {
    logger.warning(
      `The selected template is designed for tsp version ${templateRequiredVersion}, but currently using tsp version is ${compilerVersion}.`,
    );
    const cont = await vscode.window.showQuickPick(["Yes", "No"], {
      canPickMany: false,
      placeHolder:
        `Current tsp version (${compilerVersion}) < template designed tsp version(${templateRequiredVersion}). ` +
        `The project created may not be correct. Do you want to continue?`,
      ignoreFocusOut: true,
      title: TITLE,
    });
    if (cont !== "Yes") {
      logger.info(
        "User confirmed/cancelled creating TypeSpec Project due to template version mismatch.",
      );
      return false;
    }
  }

  // TODO: Why is this here again?
  // const validateResult = await client.validateInitProjectTemplate(info.template);
  // if (!validateResult) {
  //   logger.warning("Template validation failed. Please check the previous log for details.", [], {
  //     showOutput: true,
  //     showPopup: true,
  //   });
  //   const cont = await vscode.window.showQuickPick(["Yes", "No"], {
  //     canPickMany: false,
  //     placeHolder:
  //       "Template validation failed. Do you want to continue? Detail log can be found in the Output window.",
  //     ignoreFocusOut: true,
  //     title: TITLE,
  //   });
  //   if (cont !== "Yes") {
  //     logger.info("Creating TypeSpec Project cancelled due to template validation failure.");
  //     return false;
  //   }
  // }
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

async function selectLibraries(
  info: InitTemplateInfo,
): Promise<InitProjectTemplateLibrarySpec[] | undefined> {
  const libs: LibraryQuickPickItem[] =
    info.template.libraries?.map((x): LibraryQuickPickItem => {
      if (typeof x === "string") {
        return {
          label: x,
          kind: vscode.QuickPickItemKind.Default,
          description: undefined,
          name: x,
          version: undefined,
          picked: true,
        };
      }
      return {
        label: x.name,
        kind: vscode.QuickPickItemKind.Default,
        description: x.version ? `(ver: ${x.version})` : undefined,
        name: x.name,
        version: x.version,
        picked: true,
      };
    }) ?? [];
  if (libs.length === 0) return [];
  const librariesToUpgrade = await vscode.window.showQuickPick<LibraryQuickPickItem>(libs, {
    title: TITLE,
    canPickMany: true,
    placeHolder: "Here are libraries to install.",
    ignoreFocusOut: true,
  });
  return librariesToUpgrade?.map((x) => ({ name: x.name, version: x.version }));
}

async function selectTemplate(
  templateInfoMap: Map<string, InitTemplateInfo[]>,
): Promise<InitTemplateInfo | undefined> {
  const templatePickupItems: TemplateQuickPickItem[] = [];
  const toPickupItems = (x: InitTemplateInfo): TemplateQuickPickItem => {
    const label =
      (x.template.title ?? x.name) +
      ` (min compiler ver: ${x.template.compilerVersion ? x.template.compilerVersion : "-not specified-"})`;
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

async function loadInitTemplates(): Promise<Map<string, InitTemplateInfo[]>> {
  logger.info("Loading init templates from compiler...");
  const templateInfoMap: Map<string, InitTemplateInfo[]> = new Map();
  logger.info("Loading init templates from config...");
  const templates = await getTypeSpecCoreTemplates(NodeSystemHost);
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
  const settings = vscode.workspace
    .getConfiguration()
    .get<InitTemplatesUrlSetting[]>(SettingName.InitTemplatesUrls);
  if (settings) {
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

async function selectProjectRootFolder(): Promise<string | undefined> {
  logger.info("Select Project Folder as Root");
  const folderOptions: OpenDialogOptions = {
    canSelectMany: false,
    openLabel: "Select Project Folder as Root",
    canSelectFolders: true,
    canSelectFiles: false,
    title: "Select Folder",
  };

  const folderUri = await vscode.window.showOpenDialog(folderOptions);
  if (!folderUri || folderUri.length === 0) {
    return undefined;
  }
  const selectedFolder = folderUri[0].fsPath;
  logger.info(`Selected root folder: ${selectedFolder}`);
  return selectedFolder;
}

async function checkProjectRootFolderEmpty(selectedFolder: string): Promise<boolean> {
  try {
    const files = await readdir(selectedFolder);
    if (files.length > 0) {
      const cont = await vscode.window.showQuickPick(
        [
          {
            label: "Yes",
            detail: `Selected Folder: ${selectedFolder}`,
          },
          { label: "No" },
        ],
        {
          canPickMany: false,
          placeHolder:
            "The folder selected is not empty. Are you sure you want to initialize a new project here?",
          ignoreFocusOut: true,
          title: TITLE,
        },
      );
      if (cont?.label !== "Yes") {
        logger.info("Selected folder is not empty and user confirmed not to continue.");
        return false;
      }
    }
    return true;
  } catch (e) {
    logger.error("Error when checking whether selected folder is empty", [e], {
      showOutput: true,
      showPopup: true,
    });
    return false;
  }
}
