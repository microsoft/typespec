import { strictEqual } from "assert";
import { it } from "vitest";
import { DiagnosticSeverity, DiagnosticTag } from "vscode-languageserver";
import { createTestServerHost } from "../../src/testing/test-server-host.js";

it("hint by default", async () => {
  const testHost = await createTestServerHost();
  const mainFile = testHost.addOrUpdateDocument(
    "./main.tsp",
    '#suppress "deprecated" "not needed anymore"\nmodel Foo {}',
  );

  await testHost.server.compile(mainFile, undefined, { mode: "full" });
  const diags = testHost.getDiagnostics("main.tsp");
  strictEqual(diags.length, 1);
  strictEqual(diags[0].code, "unused-suppression");
  strictEqual(diags[0].severity, DiagnosticSeverity.Hint);
  strictEqual(diags[0].tags?.[0], DiagnosticTag.Unnecessary);
  strictEqual(diags[0].message, 'Suppression for "deprecated" is unused.');
});
