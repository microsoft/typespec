import vscode from "vscode";
import { getDirectoryPath, isPathAbsolute } from "./path-utils.js";
import { CodeActionCommand } from "./types.js";
import { searchAndLoadPackageJson } from "./utils.js";

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

    actions.push(...(await this.createInstallPackageByNpm(context, actions)));

    return actions;
  }

  private async createInstallPackageByNpm(
    context: vscode.CodeActionContext,
    actions: vscode.CodeAction[],
  ): Promise<vscode.CodeAction[]> {
    // When the corresponding node dependency package is not installed,
    // consider generating a quick fix to install via npm command
    const diagnostics = context.diagnostics.filter(
      (diagnostic) =>
        diagnostic.source === "TypeSpec" &&
        diagnostic.code &&
        diagnostic.code === "import-not-found",
    );
    if (diagnostics.length === 0) {
      return [];
    }

    for (const diagnostic of diagnostics) {
      if ("data" in diagnostic) {
        if (diagnostic.data && typeof diagnostic.data === "object" && "file" in diagnostic.data) {
          const packageFile = diagnostic.data.file as string;
          const { packageJsonFolder, packageJson } = await searchAndLoadPackageJson(
            getDirectoryPath(packageFile),
          );
          if (packageJsonFolder === undefined) {
            continue;
          }

          // The message content is Couldn't resolve import "@typespec/http".
          // The compiler's diagnostics do not provide a specific attribute to obtain the package name,
          // so a regular expression is used to extract the package name within the double quotes
          const targets = diagnostic.message.match(/"([^"]+)"/);
          if (targets === null) {
            continue;
          }

          // The position with index 0 contains double quotes, and the position with 1 does not contain
          const packageNameIndex = 1;
          const targetPackage = targets[packageNameIndex];

          if (
            !targetPackage.startsWith("./") &&
            !isPathAbsolute(targetPackage) &&
            packageJson &&
            ((packageJson.peerDependencies && targetPackage in packageJson.peerDependencies) ||
              (packageJson.dependencies && targetPackage in packageJson.dependencies) ||
              (packageJson.devDependencies && targetPackage in packageJson.devDependencies))
          ) {
            const action = this.createInstallPackageCodeAction(diagnostic, packageJsonFolder);
            if (!actions.some((item) => item.title === action.title)) {
              return [action];
            }
          }
        }
      }
    }
    return [];
  }

  private createInstallPackageCodeAction(
    diagnostic: vscode.Diagnostic,
    path: string,
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      "Npm install Package for Unrecognized Import",
      vscode.CodeActionKind.QuickFix,
    );
    action.command = {
      command: CodeActionCommand.NpmInstallImportPackage,
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
      command: CodeActionCommand.OpenUrl,
      title: diagnostic.message,
      arguments: [url],
    };
    action.diagnostics = [diagnostic];
    return action;
  }
}
