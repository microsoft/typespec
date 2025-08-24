import { strictEqual } from "assert";
import { it } from "vitest";
import { DiagnosticSeverity } from "vscode-languageserver";
import { createTestServerHost } from "../../src/testing/test-server-host.js";

it("hint by default", async () => {
  const testHost = await createTestServerHost();
  testHost.addOrUpdateDocument("./sub.tsp", "namespace Foo; model FooModel {};");
  const mainFile = testHost.addOrUpdateDocument("./main.tsp", 'import "./sub.tsp";\nusing Foo;');

  await testHost.server.compileInCoreMode(mainFile);
  const diags = testHost.getDiagnostics("main.tsp");
  strictEqual(diags.length, 1);
  strictEqual(diags[0].code, "@typespec/compiler/unused-using");
  strictEqual(diags[0].severity, DiagnosticSeverity.Hint);
  strictEqual(diags[0].message, "'using Foo' is declared but never be used.");
});

it("warning if enable === true", async () => {
  const testHost = await createTestServerHost();
  testHost.addOrUpdateDocument(
    "./tspconfig.yaml",
    "linter:\n  enable:\n    '@typespec/compiler/unused-using': true",
  );
  testHost.addOrUpdateDocument("./sub.tsp", "namespace Foo; model FooModel {};");
  const mainFile = testHost.addOrUpdateDocument("./main.tsp", 'import "./sub.tsp";\nusing Foo;');

  await testHost.server.compileInCoreMode(mainFile);
  const diags = testHost.getDiagnostics("main.tsp");
  strictEqual(diags.length, 1);
  strictEqual(diags[0].code, "@typespec/compiler/unused-using");
  strictEqual(diags[0].severity, DiagnosticSeverity.Warning);
  strictEqual(diags[0].message, "'using Foo' is declared but never be used.");
});

it("nothing if enable === false", async () => {
  const testHost = await createTestServerHost();
  testHost.addOrUpdateDocument(
    "./tspconfig.yaml",
    "linter:\n  enable:\n    '@typespec/compiler/unused-using': false",
  );
  testHost.addOrUpdateDocument("./sub.tsp", "namespace Foo; model FooModel {};");
  const mainFile = testHost.addOrUpdateDocument("./main.tsp", 'import "./sub.tsp";\nusing Foo;');

  await testHost.server.compileInCoreMode(mainFile);
  const diags = testHost.getDiagnostics("main.tsp");
  strictEqual(diags.length, 0);
});

it("nothing if disabled", async () => {
  const testHost = await createTestServerHost();
  testHost.addOrUpdateDocument(
    "./tspconfig.yaml",
    "linter:\n  disable:\n    '@typespec/compiler/unused-using': 'some reason'",
  );
  testHost.addOrUpdateDocument("./sub.tsp", "namespace Foo; model FooModel {};");
  const mainFile = testHost.addOrUpdateDocument("./main.tsp", 'import "./sub.tsp";\nusing Foo;');

  await testHost.server.compileInCoreMode(mainFile);
  const diags = testHost.getDiagnostics("main.tsp");
  strictEqual(diags.length, 0);
});
