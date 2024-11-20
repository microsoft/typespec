import vscode from "vscode";

const COMMAND = "CodeActionProvider.Custom.OpenUrl";

export function createCodeActionProvider() {
  return vscode.languages.registerCodeActionsProvider(
    "typespec",
    new ExtensionCodeActionProvider(),
    {
      providedCodeActionKinds: ExtensionCodeActionProvider.providedCodeActionKinds,
    },
  );
}

export function createCommandOpenUrl() {
  return vscode.commands.registerCommand(COMMAND, (url: string) =>
    vscode.env.openExternal(vscode.Uri.parse(url)),
  );
}

/**
 * Provides code actions corresponding to diagnostic problems.
 */
export class ExtensionCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  provideCodeActions(
    _document: vscode.TextDocument,
    _range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken,
  ): vscode.CodeAction[] {
    // for each diagnostic entry that has the matching `code`, create a code action command
    return context.diagnostics
      .filter((diagnostic) => typeof diagnostic.code === "object" && "target" in diagnostic.code)
      .map((diagnostic) => this.createCommandCodeAction(diagnostic));
  }

  private createCommandCodeAction(diagnostic: vscode.Diagnostic): vscode.CodeAction {
    const action = new vscode.CodeAction("Open Document", vscode.CodeActionKind.QuickFix);
    action.command = {
      command: COMMAND,
      title: "Learn more about details",
      arguments: [
        typeof diagnostic.code === "object" && "target" in diagnostic.code
          ? diagnostic.code.target.toString()
          : "",
      ],
    };
    action.diagnostics = [diagnostic];
    action.isPreferred = true;
    return action;
  }
}
