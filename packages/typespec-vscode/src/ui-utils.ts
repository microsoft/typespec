import vscode, {
  CancellationToken,
  OpenDialogOptions,
  Progress,
  QuickPick,
  QuickPickItem,
  QuickPickItemButtonEvent,
  QuickPickOptions,
} from "vscode";
import logger from "./log/logger.js";
import { Result, ResultCode } from "./types.js";
import { createPromiseWithCancelAndTimeout, tryReadDir } from "./utils.js";

export interface QuickPickOptionsWithExternalLink extends QuickPickItem {
  externalLink?: string;
}

export interface ConfirmOptions<
  T extends QuickPickOptionsWithExternalLink,
  P extends QuickPickOptionsWithExternalLink,
> {
  title?: string;
  placeholder?: string;
  yesQuickPickItem?: T;
  noQuickPickItem?: P;
}

export async function confirm<
  T extends QuickPickOptionsWithExternalLink,
  P extends QuickPickOptionsWithExternalLink,
>(confirmOptions: ConfirmOptions<T, P>): Promise<boolean | undefined> {
  const setButtonForExternalLink = (item: QuickPickOptionsWithExternalLink) => {
    if (item.externalLink) {
      item.buttons = [
        {
          iconPath: new vscode.ThemeIcon("link-external"),
          tooltip: `Open: ${item.externalLink}`,
        },
      ];
    }
  };
  const yes: QuickPickOptionsWithExternalLink = confirmOptions.yesQuickPickItem ?? { label: "Yes" };
  setButtonForExternalLink(yes);
  const no: QuickPickOptionsWithExternalLink = confirmOptions.noQuickPickItem ?? { label: "No" };
  setButtonForExternalLink(no);
  const options: QuickPickOptions = {
    title: confirmOptions.title,
    placeHolder: confirmOptions.placeholder,
    canPickMany: false,
    ignoreFocusOut: true,
  };
  const items = [yes, no];
  const selected = await showQuickPickWithButtons(items, options, (_quickpick, event) => {
    if (event.item === yes && yes.externalLink) {
      vscode.env.openExternal(vscode.Uri.parse(yes.externalLink));
    } else if (event.item === no && no.externalLink) {
      vscode.env.openExternal(vscode.Uri.parse(no.externalLink));
    } else {
      logger.warning(`Unexpected QuickPickItemButtonEvent for item ${event.item.label}`);
    }
  });
  return selected === undefined || selected.length === 0 ? undefined : selected[0] === yes;
}

export async function checkAndConfirmEmptyFolder(
  targetFolder: string,
  placeholder: string = "Selected folder is not empty. Do you want to continue?",
  title?: string,
): Promise<boolean | undefined> {
  const files = await tryReadDir(targetFolder);
  if (files === undefined) {
    logger.error(`Failed to read the selected folder: ${targetFolder}`);
    return false;
  }
  if (files.length === 0) {
    return true;
  }
  logger.info("Selected folder is not empty.");
  const confirmed = await confirm({
    title: title,
    placeholder: placeholder,
    yesQuickPickItem: {
      label: "Yes",
      detail: `Selected folder: ${targetFolder}`,
    },
    noQuickPickItem: {
      label: "No",
    },
  });
  if (confirmed === undefined) {
    logger.info("User cancelled the confirm QuickPick for non-empty folder.");
    return undefined;
  } else if (confirmed) {
    logger.info("User confirmed to continue with non empty folder.");
    return true;
  } else {
    logger.info("User confirmed not to continue with non empty folder.");
    return false;
  }
}

export async function selectFolder(
  dlgTitle: string,
  btnLabel: string,
): Promise<string | undefined> {
  logger.info(`Selecting folder for '${dlgTitle}'...`);
  const folderOptions: OpenDialogOptions = {
    canSelectMany: false,
    openLabel: btnLabel,
    canSelectFolders: true,
    canSelectFiles: false,
    title: dlgTitle,
  };

  const folderUri = await vscode.window.showOpenDialog(folderOptions);
  if (!folderUri || folderUri.length === 0) {
    logger.info(`No folder selected for '${dlgTitle}'.`);
    return undefined;
  }
  const selectedFolder = folderUri[0].fsPath;
  logger.info(`Selected folder for '${dlgTitle}': ${selectedFolder}`);
  return selectedFolder;
}

/**
 *
 * @param dlgTitle
 * @param btnLabel
 * @param filters refer to {@link OpenDialogOptions.filters} . 
    A set of file filters that are used by the dialog. Each entry is a human-readable label
		like "TypeScript", and an array of extensions, for example:
		```ts
		{
			'Images': ['png', 'jpg'],
			'TypeScript': ['ts', 'tsx']
		}
		```
 * @returns
 */
export async function selectFile(
  dlgTitle: string,
  btnLabel: string,
  filters: { [name: string]: string[] },
): Promise<string | undefined> {
  logger.info(`Selecting file for '${dlgTitle}' ...`);
  const fileOptions: OpenDialogOptions = {
    canSelectMany: false,
    openLabel: btnLabel,
    canSelectFolders: false,
    canSelectFiles: true,
    filters: filters,
    title: dlgTitle,
  };

  const fileUri = await vscode.window.showOpenDialog(fileOptions);
  if (!fileUri || fileUri.length === 0) {
    logger.info(`No file selected for '${dlgTitle}'.`);
    return undefined;
  }
  const selectedFile = fileUri[0].fsPath;
  logger.info(`Selected file for '${dlgTitle}': ${selectedFile}`);
  return selectedFile;
}

interface ProgressOptions {
  title: string;
  withCancelAndTimeout: boolean;
  /** Only take effect when {@link ProgressOptions.withCancelAndTimeout} is true */
  timeoutInMs: number;
}

export interface ExecuteWithUiOptions<
  T extends QuickPickOptionsWithExternalLink,
  P extends QuickPickOptionsWithExternalLink,
> {
  /**
   * The name of the execution. Only used for logging now
   */
  name: string;
  /**
   * Confirm options. No confirm step when undefined
   */
  confirm?: ConfirmOptions<T, P>;
  /**
   * Progress options. No progress when undefined
   */
  progress?: ProgressOptions;
}

export async function tryExecuteWithUi<
  T,
  P extends QuickPickOptionsWithExternalLink,
  Q extends QuickPickOptionsWithExternalLink,
>(
  options: ExecuteWithUiOptions<P, Q>,
  func: (
    progress:
      | Progress<{
          message?: string;
          increment?: number;
        }>
      | undefined,
    token: CancellationToken | undefined,
  ) => Promise<T>,
): Promise<Result<T>> {
  if (options.confirm) {
    const confirmed = await confirm(options.confirm);
    if (confirmed !== true) {
      logger.info(`User cancelled or declined the confirmation for '${options.name}'.`);
      return { code: ResultCode.Cancelled };
    }
  }

  if (options.progress) {
    const po = options.progress;
    return await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        cancellable: true,
        title: options.progress.title,
      },
      async (progress, token) => {
        try {
          const r =
            po.withCancelAndTimeout === true
              ? await createPromiseWithCancelAndTimeout(
                  func(progress, token),
                  token,
                  po.timeoutInMs,
                )
              : await func(progress, token);
          return { code: ResultCode.Success, value: r };
        } catch (e: any) {
          if (e === ResultCode.Cancelled) {
            logger.info(`User cancelled the progress: "${options.name}"`);
            return { code: ResultCode.Cancelled };
          } else if (e === ResultCode.Timeout) {
            logger.error(`Progress "${options.name}" timeout after ${po.timeoutInMs}ms`, [e]);
            return { code: ResultCode.Timeout };
          } else {
            logger.error(`Unexpected error in the progress of "${options.name}"`, [e]);
            return { code: ResultCode.Fail, details: e };
          }
        }
      },
    );
  } else {
    try {
      const r = await func(undefined, undefined);
      return { code: ResultCode.Success, value: r };
    } catch (e) {
      logger.error(`Unexpected error for ${options.name}`, [e]);
      return { code: ResultCode.Fail, details: e };
    }
  }
}

export async function showQuickPickWithButtons<T extends QuickPickItem>(
  items: T[],
  options: QuickPickOptions,
  onItemButtonTriggered: (quickpick: QuickPick<T>, item: QuickPickItemButtonEvent<T>) => void,
) {
  const quickPickup = vscode.window.createQuickPick<T>();
  quickPickup.items = items;
  if (options.title) quickPickup.title = options.title;
  if (options.placeHolder) quickPickup.placeholder = options.placeHolder;
  if (options.canPickMany) quickPickup.canSelectMany = options.canPickMany;
  if (options.ignoreFocusOut) quickPickup.ignoreFocusOut = options.ignoreFocusOut;
  if (options.matchOnDescription) quickPickup.matchOnDescription = options.matchOnDescription;
  if (options.matchOnDetail) quickPickup.matchOnDetail = options.matchOnDetail;
  quickPickup.onDidTriggerItemButton((event) => {
    onItemButtonTriggered(quickPickup, event);
  });
  const selectionPromise = new Promise<T[] | undefined>((resolve) => {
    quickPickup.onDidAccept(() => {
      const selectedItem = [...quickPickup.selectedItems];
      resolve(selectedItem);
      quickPickup.hide();
    });
    quickPickup.onDidHide(() => {
      resolve(undefined);
      quickPickup.dispose();
    });
  });
  quickPickup.show();

  return selectionPromise;
}
