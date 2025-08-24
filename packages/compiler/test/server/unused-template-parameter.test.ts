import { strictEqual } from "assert";
import { it } from "vitest";
import { DiagnosticSeverity } from "vscode-languageserver";
import { createTestServerHost } from "../../src/testing/test-server-host.js";

it("hint by default", async () => {
  const testServerHost = await createTestServerHost();
  const mainFile = testServerHost.addOrUpdateDocument(
    "main.tsp",
    `
        model A<T> {
          id: string;
        }
      `,
  );
  await testServerHost.server.compileCore(mainFile);
  const diagnostics = testServerHost.getDiagnostics("main.tsp");
  strictEqual(diagnostics.length, 1);
  strictEqual(diagnostics[0].code, "@typespec/compiler/unused-template-parameter");
  strictEqual(diagnostics[0].severity, DiagnosticSeverity.Hint);
  strictEqual(
    diagnostics[0].message,
    "Templates should use all specified parameters, and parameter 'T' does not exist in type 'A'. Consider removing this parameter.",
  );
});

it("warning if lint rule enable === true", async () => {
  const testServerHost = await createTestServerHost();
  testServerHost.addOrUpdateDocument(
    "./tspconfig.yaml",
    "linter:\n  enable:\n    '@typespec/compiler/unused-template-parameter': true",
  );
  const mainFile = testServerHost.addOrUpdateDocument(
    "main.tsp",
    `
        model A<T> {
          id: string;
        }
      `,
  );
  await testServerHost.server.compileCore(mainFile);
  const diagnostics = testServerHost.getDiagnostics("main.tsp");
  strictEqual(diagnostics.length, 1);
  strictEqual(diagnostics[0].code, "@typespec/compiler/unused-template-parameter");
  strictEqual(diagnostics[0].severity, DiagnosticSeverity.Warning);
  strictEqual(
    diagnostics[0].message,
    "Templates should use all specified parameters, and parameter 'T' does not exist in type 'A'. Consider removing this parameter.",
  );
});

it("no diagnostic if lint rule enable === false", async () => {
  const testServerHost = await createTestServerHost();
  testServerHost.addOrUpdateDocument(
    "./tspconfig.yaml",
    "linter:\n  enable:\n    '@typespec/compiler/unused-template-parameter': false",
  );
  const mainFile = testServerHost.addOrUpdateDocument(
    "main.tsp",
    `
        model A<T> {
          id: string;
        }
      `,
  );
  await testServerHost.server.compileCore(mainFile);
  const diagnostics = testServerHost.getDiagnostics("main.tsp");
  strictEqual(diagnostics.length, 0);
});

it("no diagnostic if lint rule disabled", async () => {
  const testServerHost = await createTestServerHost();
  testServerHost.addOrUpdateDocument(
    "./tspconfig.yaml",
    "linter:\n  disable:\n    '@typespec/compiler/unused-template-parameter': 'some reason'",
  );
  const mainFile = testServerHost.addOrUpdateDocument(
    "main.tsp",
    `
        model A<T> {
          id: string;
        }
      `,
  );
  await testServerHost.server.compileCore(mainFile);
  const diagnostics = testServerHost.getDiagnostics("main.tsp");
  strictEqual(diagnostics.length, 0);
});
