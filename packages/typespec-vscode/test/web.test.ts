import { assert } from "vitest";
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
// import * as myExtension from '../../extension';

async function waitSeconds(secs: number) {
  return new Promise((r) => setTimeout(r, secs * 1000));
}

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

    await waitSeconds(5);
  });

  it("start extension", async () => {});

  it("ColorProvider", async () => {
    const doc = await vscode.workspace.openTextDocument(basicUri);
    const colors = (await vscode.commands.executeCommand(
      "vscode.executeDocumentColorProvider",
      doc.uri,
    )) as any[];
    console.log("Colors", doc.uri, colors);
    assert.ok(colors);
    assert.equal(colors.length, 3);
    const expected: any = [
      { red: 1, green: 0, blue: 0, alpha: 1 },
      {
        red: 0.9411764705882353,
        green: 0.9725490196078431,
        blue: 1,
        alpha: 1,
      },
      {
        red: 0.4980392156862745,
        green: 0.4980392156862745,
        blue: 0.4980392156862745,
        alpha: 1,
      },
    ];

    for (const i of [0, 1, 2]) {
      for (const prop in expected[i]) {
        assert.approximately(colors[i].color[prop], expected[i][prop], 1e-4);
      }
    }
  });
});
