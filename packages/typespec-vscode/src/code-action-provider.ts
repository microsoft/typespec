import vscode from "vscode";
import { getDirectoryPath, isPathAbsolute, resolvePath } from "./path-utils.js";
import { CodeActionCommand } from "./types.js";
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

    for (const diagnostic of diagnostics) {
      if ("data" in diagnostic) {
        if (diagnostic.data && typeof diagnostic.data === "object" && "file" in diagnostic.data) {
          const packageFile = diagnostic.data.file as string;
          const targetPackageUri = await this.findPackageJsonFilePath(
            getDirectoryPath(packageFile),
          );
          if (targetPackageUri === undefined) {
            continue;
          }

          const targets = diagnostic.message.match(/"([^"]+)"/);
          if (targets === null) {
            continue;
          }

          // The position with index 0 contains double quotes, and the position with 1 does not contain
          const packageNameIndex = 1;
          const targetPackage = targets[packageNameIndex];

          const packageJson = await loadPackageJsonFile(targetPackageUri);
          if (
            !targetPackage.startsWith("./") &&
            !isPathAbsolute(targetPackage) &&
            packageJson &&
            (Object.prototype.hasOwnProperty.call(packageJson.peerDependencies, targetPackage) ||
              Object.prototype.hasOwnProperty.call(packageJson.dependencies, targetPackage) ||
              Object.prototype.hasOwnProperty.call(packageJson.devDependencies, targetPackage))
          ) {
            const action = this.createInstallPackageCodeAction(diagnostic, targetPackageUri);
            if (!actions.some((item) => item.title === action.title)) {
              actions.push(action);
            }
          }
        }
      }
    }

    return actions;
  }

  private async findPackageJsonFilePath(startPath: string): Promise<string | undefined> {
    let currentPath = startPath;
    const projectRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    while (projectRoot && currentPath.length <= projectRoot.length) {
      const packageJsonPath = resolvePath(currentPath, "package.json");
      const stats = await vscode.workspace.fs.stat(vscode.Uri.file(packageJsonPath));
      if (stats.type === vscode.FileType.File) {
        return packageJsonPath;
      }
      currentPath = getDirectoryPath(currentPath);
    }

    return undefined;
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
