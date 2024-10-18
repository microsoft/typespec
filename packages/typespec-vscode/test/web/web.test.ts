import { assert } from "vitest";
import * as vscode from "vscode";

describe("Web Extension", () => {
  vscode.window.showInformationMessage("Start all tests.");

  let basicUri: vscode.Uri;
  before(async () => {
    const ext = vscode.extensions.getExtension("typespec.typespec-vscode");
    assert.ok(ext, "Could not activate extension!");
    await ext!.activate();

    const scheme = ext?.extensionUri.scheme === "file" ? "file" : "vscode-test-web";
    const pathPrefix = scheme === "file" ? ext?.extensionUri.fsPath + "/test" : "";

    basicUri = vscode.Uri.from({ scheme, path: pathPrefix + "/basic.tsp" });
  });

  it("open tsp file", async () => {
    await vscode.workspace.openTextDocument(basicUri);
  });
});
