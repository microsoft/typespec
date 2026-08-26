import * as vscode from "vscode";

export async function runWebTests(): Promise<void> {
  const ext = vscode.extensions.getExtension("typespec.typespec-vscode");
  if (!ext) {
    throw new Error("Could not find extension!");
  }
  await ext.activate();

  const scheme = ext.extensionUri.scheme === "file" ? "file" : "vscode-test-web";
  const pathPrefix = scheme === "file" ? ext.extensionUri.fsPath + "/test" : "";
  const basicUri = vscode.Uri.from({ scheme, path: pathPrefix + "/basic.tsp" });

  // Test: open tsp file
  await vscode.workspace.openTextDocument(basicUri);
}
