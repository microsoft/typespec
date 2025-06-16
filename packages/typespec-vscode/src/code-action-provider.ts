import { PackageJson } from "@typespec/compiler";
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
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      // for each diagnostic entry that has the matching `code`, create a code action command
      // A CodeAction will only be created if it is a TypeSpec diagnostic and code is an object and has a target attribute
      // target attribute is the URL to open

      // target is a Uri type, which corresponds to diagnostic.codeDescription.href in compiler
      // When target is empty, it does not exist in the code object, so the code action will not be created
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

      // When the corresponding node dependency package is not installed,
      // consider generating a quick fix to install via npm command
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

        const pkgNameInPkgFile = this.isPackageInPackageJson(targetPackage, packageJson);

        // Whether there is or not the package.json file, the installation command will be created;
        // when there is no package.json file, the user will be given a clear message prompt.
        actions.push(
          this.createInstallPackageCodeAction(
            diagnostic,
            targetPackage,
            pkgNameInPkgFile,
            packageJsonFolder,
          ),
        );
      }
    }

    return actions;
  }

  /**
   * Determines whether the given packageName is in the package.json file.
   *
   * - targetPackage is not a relative or absolute path
   * - if it's listed in the package.json's dependencies, devDependencies, or peerDependencies.
   *
   * @param targetPackage - The name of the package to check.
   * @param packageJson - The parsed package.json file content or undefined if not available.
   * @returns True if packageName is in package.json file, false otherwise.
   */
  private isPackageInPackageJson(
    targetPackage: string,
    packageJson: PackageJson | undefined,
  ): boolean {
    if (
      !targetPackage.startsWith("./") &&
      !targetPackage.startsWith("../") &&
      !isPathAbsolute(targetPackage) &&
      packageJson
    ) {
      return !!(
        (packageJson.peerDependencies && targetPackage in packageJson.peerDependencies) ||
        (packageJson.dependencies && targetPackage in packageJson.dependencies) ||
        (packageJson.devDependencies && targetPackage in packageJson.devDependencies)
      );
    }

    return false;
  }

  private createInstallPackageCodeAction(
    diagnostic: vscode.Diagnostic,
    pkgName: string,
    pkgNameInPkgFile: boolean,
    projectFolder?: string,
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `Install "${pkgName}" using npm`,
      vscode.CodeActionKind.QuickFix,
    );
    action.command = {
      command: CodeActionCommand.NpmInstallPackage,
      title: diagnostic.message,
      arguments: [projectFolder, pkgName, pkgNameInPkgFile],
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
