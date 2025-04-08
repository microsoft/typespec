import vscode from "vscode";
import { isPathAbsolute, normalizeSlashes } from "./path-utils.js";
import { CommandName } from "./types.js";
import { loadPackageJsonFile } from "./utils.js";

export function createCodeActionProvider() {
  return vscode.languages.registerCodeActionsProvider(
    "typespec",
    new TypeSpecCodeActionProvider(),
    {
      providedCodeActionKinds: TypeSpecCodeActionProvider.providedCodeActionKinds,
    },
  );
}

/**
 * Provides code actions corresponding to diagnostic problems.
 */
export class TypeSpecCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  public async provideCodeActions(
    _document: vscode.TextDocument,
    _range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken,
  ): Promise<vscode.CodeAction[]> {
    // for each diagnostic entry that has the matching `code`, create a code action command
    // A CodeAction will only be created if it is a TypeSpec diagnostic and code is an object and has a target attribute
    // target attribute is the URL to open

    // target is a Uri type, which corresponds to diagnostic.codeDescription.href in compiler
    // When target is empty, it does not exist in the code object, so the code action will not be created
    const actions: vscode.CodeAction[] = [];
    context.diagnostics.forEach((diagnostic) => {
      if (
        diagnostic.source === "TypeSpec" &&
        diagnostic.code &&
        typeof diagnostic.code === "object" &&
        "target" in diagnostic.code &&
        "value" in diagnostic.code
      ) {
        actions.push(
          this.createOpenUrlCodeAction(
            diagnostic,
            diagnostic.code.target.toString(),
            diagnostic.code.value.toString(),
          ),
        );
      }
    });

    // When the corresponding node dependency package is not installed,
    // consider generating a quick fix to install via npm command
    const diagnostics = context.diagnostics.filter(
      (diagnostic) =>
        diagnostic.source === "TypeSpec" &&
        diagnostic.code &&
        diagnostic.code === "import-not-found",
    );
    if (diagnostics.length === 0) {
      return actions;
    }

    const uris = await vscode.workspace
      .findFiles("**/package.json", "**/node_modules/**")
      .then((uris) =>
        uris
          .filter((uri) => uri.scheme === "file" && !uri.fsPath.includes("node_modules"))
          .map((uri) => normalizeSlashes(uri.fsPath)),
      );
    if (uris.length === 0) {
      return actions;
    }

    const packageNames: Map<string, string> = new Map();
    for (const uri of uris) {
      const packageJson = await loadPackageJsonFile(uri);
      if (packageJson && packageJson.peerDependencies) {
        for (const key in packageJson.peerDependencies) {
          if (!packageNames.has(key) && !key.startsWith("./") && !isPathAbsolute(key)) {
            packageNames.set(key, uri);
          }
        }
      }
      if (packageJson && packageJson.dependencies) {
        for (const key in packageJson.dependencies) {
          if (!packageNames.has(key) && !key.startsWith("./") && !isPathAbsolute(key)) {
            packageNames.set(key, uri);
          }
        }
      }
      if (packageJson && packageJson.devDependencies) {
        for (const key in packageJson.devDependencies) {
          if (!packageNames.has(key) && !key.startsWith("./") && !isPathAbsolute(key)) {
            packageNames.set(key, uri);
          }
        }
      }
    }

    for (const diagnostic of diagnostics) {
      const targets = diagnostic.message.match(/"([^"]+)"/);
      if (targets === null) {
        continue;
      }

      // The position with index 0 contains double quotes, and the position with 1 does not contain
      const targetPackage = targets[1];
      if (!packageNames.has(targetPackage)) {
        continue;
      }

      const action = this.createInstallPackageCodeAction(
        diagnostic,
        packageNames.get(targetPackage)!,
      );
      if (!actions.some((item) => item.title === action.title)) {
        actions.push(action);
      }
    }

    return actions;
  }

  private createInstallPackageCodeAction(
    diagnostic: vscode.Diagnostic,
    path: string,
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      "Install(Npm) Package for Unrecognized Import",
      vscode.CodeActionKind.QuickFix,
    );
    action.command = {
      command: CommandName.NpmInstallImportPackage,
      title: diagnostic.message,
      arguments: [path],
    };
    action.diagnostics = [diagnostic];
    return action;
  }

  private createOpenUrlCodeAction(
    diagnostic: vscode.Diagnostic,
    url: string,
    codeActionTitle: string,
  ): vscode.CodeAction {
    // 'vscode.CodeActionKind.Empty' does not generate a Code Action menu, You must use 'vscode.CodeActionKind.QuickFix'
    const action = new vscode.CodeAction(
      `See documentation for "${codeActionTitle}"`,
      vscode.CodeActionKind.QuickFix,
    );
    action.command = {
      command: CommandName.OpenUrl,
      title: diagnostic.message,
      arguments: [url],
    };
    action.diagnostics = [diagnostic];
    return action;
  }
}
