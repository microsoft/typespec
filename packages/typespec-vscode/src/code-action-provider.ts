import vscode from "vscode";
import { OPEN_URL_COMMAND } from "./vscode-command.js";

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

  provideCodeActions(
    _document: vscode.TextDocument,
    _range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken,
  ): vscode.CodeAction[] {
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
        "target" in diagnostic.code
      ) {
        actions.push(this.createOpenUrlCodeAction(diagnostic, diagnostic.code.target.toString()));
      }
    });
    return actions;
  }

  private createOpenUrlCodeAction(diagnostic: vscode.Diagnostic, url: string): vscode.CodeAction {
    // vscode. CodeActionKind.Empty does not generate a Quick Fix menu
    const action = new vscode.CodeAction("Open Document", vscode.CodeActionKind.QuickFix);
    action.command = {
      command: OPEN_URL_COMMAND,
      title: "Learn more about details",
      arguments: [url],
    };
    action.diagnostics = [diagnostic];
    return action;
  }
}
