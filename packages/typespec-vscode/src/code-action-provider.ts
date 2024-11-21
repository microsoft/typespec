import vscode from "vscode";
import { OPEN_URL_COMMAND } from "./const.js";

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
    return context.diagnostics
      .filter(
        (diagnostic) =>
          diagnostic.source === "TypeSpec" &&
          typeof diagnostic.code === "object" &&
          "target" in diagnostic.code,
      )
      .map((diagnostic) => this.createOpenUrlCodeAction(diagnostic));
  }

  private createOpenUrlCodeAction(diagnostic: vscode.Diagnostic): vscode.CodeAction {
    // The target will only exist if the compiler's diagnosis contains the url, so no data will be stored.
    if (typeof diagnostic.code === "object" && "target" in diagnostic.code) {
      const action = new vscode.CodeAction("Open Document", vscode.CodeActionKind.QuickFix);
      action.command = {
        command: OPEN_URL_COMMAND,
        title: "Learn more about details",
        arguments: [diagnostic.code.target.toString()],
      };
      action.diagnostics = [diagnostic];
      return action;
    }

    // Because it has been filtered above, this statement will never trigger
    return new vscode.CodeAction("", vscode.CodeActionKind.Empty);
  }
}
