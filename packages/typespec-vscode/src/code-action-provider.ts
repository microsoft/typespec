import vscode from "vscode";
import logger from "./log/logger.js";
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

    actions.push(...(await this.createInstallPackageByNpm(context)));

    return actions;
  }

  private async createInstallPackageByNpm(
    context: vscode.CodeActionContext,
  ): Promise<vscode.CodeAction[]> {
    // When the corresponding node dependency package is not installed,
    // consider generating a quick fix to install via npm command
    const actions: vscode.CodeAction[] = [];
    for (const diagnostic of context.diagnostics) {
      if (
        diagnostic.source === "TypeSpec" &&
        diagnostic.code &&
        diagnostic.code === "import-not-found" &&
        "data" in diagnostic &&
        diagnostic.data &&
        typeof diagnostic.data === "object" &&
        "file" in diagnostic.data
      ) {
        // The message content is `Couldn't resolve import "@typespec/http"`.
        // The compiler's diagnostics do not provide a specific attribute to obtain the package name,
        // so a regular expression is used to extract the package name within the double quotes,
        // if no match is reached, the original string is returned
        const targetPackage = diagnostic.message.replace(/.*"([^"]+)".*/, "$1");
        logger.debug(`The target package name is '${targetPackage}'.`);

        const packageFile = diagnostic.data.file as string;
        const packageFileUri = vscode.Uri.parse(packageFile);
        const { packageJsonFolder, packageJson } = await searchAndLoadPackageJson(
          getDirectoryPath(packageFileUri.fsPath),
        );

        if (packageJsonFolder === undefined) {
          actions.push(this.createInstallPackageCodeAction(diagnostic, "", false));
        } else if (
          !targetPackage.startsWith("./") &&
          !targetPackage.startsWith("../") &&
          !isPathAbsolute(targetPackage) &&
          packageJson &&
          ((packageJson.peerDependencies && targetPackage in packageJson.peerDependencies) ||
            (packageJson.dependencies && targetPackage in packageJson.dependencies) ||
            (packageJson.devDependencies && targetPackage in packageJson.devDependencies))
        ) {
          actions.push(this.createInstallPackageCodeAction(diagnostic, packageJsonFolder));
        }
      }
    }
    return actions;
  }

  private createInstallPackageCodeAction(
    diagnostic: vscode.Diagnostic,
    projectFolder: string,
    hasPackageFile: boolean = true,
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      "Install package by `npm install` for unrecognized import",
      vscode.CodeActionKind.QuickFix,
    );
    action.command = {
      command: CodeActionCommand.NpmInstallImportPackage,
      title: diagnostic.message,
      arguments: [projectFolder, hasPackageFile],
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
