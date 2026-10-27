import { expect, it } from "vitest";
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
  expect(diags.length).toBe(1);
  expect(diags[0].code).toBe("unused-suppression");
  expect(diags[0].severity).toBe(DiagnosticSeverity.Hint);
  expect(diags[0].tags?.[0]).toBe(DiagnosticTag.Unnecessary);
  expect(diags[0].message).toBe('Suppression for "deprecated" is unused.');
});
