import vscode from "vscode";
import { State } from "vscode-languageclient";
import logger from "./log/logger.js";
import { getAnyExtensionFromPath } from "./path-utils.js";
import { TspLanguageClient } from "./tsp-language-client.js";
import { MoveOrRenameAction, SettingName } from "./types.js";
import { createPromiseWithCancelAndTimeout } from "./utils.js";

export async function updateImportsOnFileMovedOrRenamed(
  e: vscode.FileRenameEvent,
  client?: TspLanguageClient,
): Promise<void> {
  if (client && client.state === State.Running) {
    const tspExtensionName = ".tsp";
    const renames: MoveOrRenameAction[] = [];

    for (const { newUri, oldUri } of e.files) {
      // Skip if the file is not a TypeScript file
      if (getAnyExtensionFromPath(newUri.path) !== tspExtensionName) {
        continue;
      }

      if (getAnyExtensionFromPath(oldUri.path) !== tspExtensionName) {
        continue;
      }

      const setting = vscode.workspace
        .getConfiguration()
        .get(SettingName.UpdateImportsOnFileMovedOrRenamed, true);
      if (!setting) {
        continue;
      }

      renames.push({
        newFilePath: newUri.fsPath,
        oldFilePath: oldUri.fsPath,
      });

      vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Window,
          title: "Checking for update of TSP imports",
        },
        async (_progress, token) => {
          const TIMEOUT = 300000; // set timeout to 5 minutes which should be enough for changes imports
          await createPromiseWithCancelAndTimeout(flushRenames(client), token, TIMEOUT);
        },
      );
    }

    async function flushRenames(client?: TspLanguageClient): Promise<void> {
      const tspOpenedFiles = vscode.workspace.textDocuments.filter(
        (doc) => getAnyExtensionFromPath(doc.fileName) === tspExtensionName,
      );
      if (tspOpenedFiles && tspOpenedFiles.length <= 0) {
        return;
      }

      for (const { newFilePath, oldFilePath } of renames) {
        const updatedFiles = await withEditsForFileMovedOrRenamed(
          oldFilePath,
          newFilePath,
          tspOpenedFiles[0].uri.fsPath,
          client,
        );

        await showMessageToUser(updatedFiles);
      }
    }
  } else {
    logger.warning(
      "TypeSpec language server is not running, skipping update imports on file rename.",
    );
  }
}

async function withEditsForFileMovedOrRenamed(
  oldFilePath: string,
  newFilePath: string,
  openedFilePath: string,
  client?: TspLanguageClient,
): Promise<string[]> {
  if (!client) {
    return [];
  }

  return await client.updateImportsOnFileMovedOrRenamed(oldFilePath, newFilePath, openedFilePath);
}

async function showMessageToUser(newResources: string[]): Promise<void> {
  if (!newResources.length) {
    return;
  }

  await vscode.window.showInformationMessage(
    newResources.length === 1
      ? `Update imports for '${newResources[0]}'`
      : getMessageForUser(
          `Update imports for the following ${newResources.length} files:`,
          newResources,
        ),
    { modal: true },
  );
}

function getMessageForUser(start: string, resourcesToConfirm: readonly string[]): string {
  const MAX_CONFIRM_FILES = 10;

  const paths = [start];
  paths.push("");
  paths.push(...resourcesToConfirm.slice(0, MAX_CONFIRM_FILES).map((r) => r));

  if (resourcesToConfirm.length > MAX_CONFIRM_FILES) {
    if (resourcesToConfirm.length - MAX_CONFIRM_FILES === 1) {
      paths.push("...1 additional file not shown");
    } else {
      paths.push(`...${resourcesToConfirm.length - MAX_CONFIRM_FILES} additional files not shown`);
    }
  }

  paths.push("");
  return paths.join("\n");
}
