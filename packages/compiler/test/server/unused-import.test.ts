import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { DiagnosticSeverity } from "vscode-languageserver";
import { createTestServerHost } from "../../src/testing/test-server-host.js";

describe("unused import", () => {
  it("hint by default for unused import", async () => {
    const testHost = await createTestServerHost();
    testHost.addOrUpdateDocument("./models.tsp", "model Bun { prop: string; }");
    const mainFile = testHost.addOrUpdateDocument(
      "./main.tsp",
      'import "./models.tsp";\nmodel Foo { bar: string; }',
    );

    await testHost.server.compile(mainFile, undefined, { mode: "full" });
    const diags = testHost.getDiagnostics("main.tsp");
    const unusedImportDiags = diags.filter((d) => d.code === "@typespec/compiler/unused-import");
    strictEqual(unusedImportDiags.length, 1);
    strictEqual(unusedImportDiags[0].severity, DiagnosticSeverity.Hint);
    strictEqual(unusedImportDiags[0].message, "Import './models.tsp' is declared but never used.");
  });

  it("no diagnostic if import is used", async () => {
    const testHost = await createTestServerHost();
    testHost.addOrUpdateDocument("./models.tsp", "model Bun { prop: string; }");
    const mainFile = testHost.addOrUpdateDocument(
      "./main.tsp",
      'import "./models.tsp";\nmodel Foo { bar: Bun; }',
    );

    await testHost.server.compile(mainFile, undefined, { mode: "full" });
    const diags = testHost.getDiagnostics("main.tsp");
    const unusedImportDiags = diags.filter((d) => d.code === "@typespec/compiler/unused-import");
    strictEqual(unusedImportDiags.length, 0);
  });

  it("warning if enable === true", async () => {
    const testHost = await createTestServerHost();
    testHost.addOrUpdateDocument(
      "./tspconfig.yaml",
      "linter:\n  enable:\n    '@typespec/compiler/unused-import': true",
    );
    testHost.addOrUpdateDocument("./models.tsp", "model Bun { prop: string; }");
    const mainFile = testHost.addOrUpdateDocument(
      "./main.tsp",
      'import "./models.tsp";\nmodel Foo { bar: string; }',
    );

    await testHost.server.compile(mainFile, undefined, { mode: "full" });
    const diags = testHost.getDiagnostics("main.tsp");
    const unusedImportDiags = diags.filter((d) => d.code === "@typespec/compiler/unused-import");
    strictEqual(unusedImportDiags.length, 1);
    strictEqual(unusedImportDiags[0].severity, DiagnosticSeverity.Warning);
    strictEqual(unusedImportDiags[0].message, "Import './models.tsp' is declared but never used.");
  });

  it("nothing if enable === false", async () => {
    const testHost = await createTestServerHost();
    testHost.addOrUpdateDocument(
      "./tspconfig.yaml",
      "linter:\n  enable:\n    '@typespec/compiler/unused-import': false",
    );
    testHost.addOrUpdateDocument("./models.tsp", "model Bun { prop: string; }");
    const mainFile = testHost.addOrUpdateDocument(
      "./main.tsp",
      'import "./models.tsp";\nmodel Foo { bar: string; }',
    );

    await testHost.server.compile(mainFile, undefined, { mode: "full" });
    const diags = testHost.getDiagnostics("main.tsp");
    const unusedImportDiags = diags.filter((d) => d.code === "@typespec/compiler/unused-import");
    strictEqual(unusedImportDiags.length, 0);
  });

  it("nothing if disabled", async () => {
    const testHost = await createTestServerHost();
    testHost.addOrUpdateDocument(
      "./tspconfig.yaml",
      "linter:\n  disable:\n    '@typespec/compiler/unused-import': 'some reason'",
    );
    testHost.addOrUpdateDocument("./models.tsp", "model Bun { prop: string; }");
    const mainFile = testHost.addOrUpdateDocument(
      "./main.tsp",
      'import "./models.tsp";\nmodel Foo { bar: string; }',
    );

    await testHost.server.compile(mainFile, undefined, { mode: "full" });
    const diags = testHost.getDiagnostics("main.tsp");
    const unusedImportDiags = diags.filter((d) => d.code === "@typespec/compiler/unused-import");
    strictEqual(unusedImportDiags.length, 0);
  });
});
