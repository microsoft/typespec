import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { DiagnosticSeverity } from "vscode-languageserver";
import { createTestServerHost } from "../../src/testing/test-server-host.js";

describe("unused import", () => {
  it("only marks the unused import, not other imports", async () => {
    const testHost = await createTestServerHost();
    testHost.addOrUpdateDocument(
      "./tspconfig.yaml",
      "linter:\n  enable:\n    '@typespec/compiler/unused-import': true",
    );
    testHost.addOrUpdateDocument("./used.tsp", "model UsedModel { prop: string; }");
    testHost.addOrUpdateDocument("./unused.tsp", "model UnusedModel { prop: string; }");
    const mainFile = testHost.addOrUpdateDocument(
      "./main.tsp",
      'import "./used.tsp";\nimport "./unused.tsp";\n\nmodel Foo { bar: UsedModel; }',
    );

    await testHost.server.compile(mainFile, undefined, { mode: "full" });
    const diags = testHost.getDiagnostics("main.tsp");
    const unusedImportDiags = diags.filter((d) => d.code === "@typespec/compiler/unused-import");
    strictEqual(unusedImportDiags.length, 1);
    strictEqual(unusedImportDiags[0].message, "Import './unused.tsp' is declared but never used.");
  });

  it("correctly handles unused import before used import", async () => {
    const testHost = await createTestServerHost();
    testHost.addOrUpdateDocument(
      "./tspconfig.yaml",
      "linter:\n  enable:\n    '@typespec/compiler/unused-import': true",
    );
    testHost.addOrUpdateDocument("./used.tsp", "model UsedModel { prop: string; }");
    testHost.addOrUpdateDocument("./unused.tsp", "model UnusedModel { prop: string; }");
    const mainFile = testHost.addOrUpdateDocument(
      "./main.tsp",
      'import "./unused.tsp";\nimport "./used.tsp";\n\nmodel Foo { bar: UsedModel; }',
    );

    await testHost.server.compile(mainFile, undefined, { mode: "full" });
    const diags = testHost.getDiagnostics("main.tsp");
    const unusedImportDiags = diags.filter((d) => d.code === "@typespec/compiler/unused-import");
    strictEqual(unusedImportDiags.length, 1);
    strictEqual(unusedImportDiags[0].message, "Import './unused.tsp' is declared but never used.");
  });

  it("correctly handles multiple used imports with one unused in the middle", async () => {
    const testHost = await createTestServerHost();
    testHost.addOrUpdateDocument(
      "./tspconfig.yaml",
      "linter:\n  enable:\n    '@typespec/compiler/unused-import': true",
    );
    testHost.addOrUpdateDocument("./used1.tsp", "model UsedModel1 { prop: string; }");
    testHost.addOrUpdateDocument("./unused.tsp", "model UnusedModel { prop: string; }");
    testHost.addOrUpdateDocument("./used2.tsp", "model UsedModel2 { prop: string; }");
    const mainFile = testHost.addOrUpdateDocument(
      "./main.tsp",
      'import "./used1.tsp";\nimport "./unused.tsp";\nimport "./used2.tsp";\n\nmodel Foo { bar: UsedModel1; baz: UsedModel2; }',
    );

    await testHost.server.compile(mainFile, undefined, { mode: "full" });
    const diags = testHost.getDiagnostics("main.tsp");
    const unusedImportDiags = diags.filter((d) => d.code === "@typespec/compiler/unused-import");
    strictEqual(unusedImportDiags.length, 1);
    strictEqual(unusedImportDiags[0].message, "Import './unused.tsp' is declared but never used.");
  });

  it("does not mark import as unused when enum is used as generic type parameter", async () => {
    const testHost = await createTestServerHost();
    testHost.addOrUpdateDocument(
      "./tspconfig.yaml",
      "linter:\n  enable:\n    '@typespec/compiler/unused-import': true",
    );
    testHost.addOrUpdateDocument("./enums.tsp", "enum MyEnum { A, B, C }");
    const mainFile = testHost.addOrUpdateDocument(
      "./main.tsp",
      'import "./enums.tsp";\n\nmodel Container<T> { value: T; }\nmodel Foo { bar: Container<MyEnum>; }',
    );

    await testHost.server.compile(mainFile, undefined, { mode: "full" });
    const diags = testHost.getDiagnostics("main.tsp");
    const unusedImportDiags = diags.filter((d) => d.code === "@typespec/compiler/unused-import");
    strictEqual(unusedImportDiags.length, 0);
  });

  it("does not mark import as unused when enum member is accessed", async () => {
    const testHost = await createTestServerHost();
    testHost.addOrUpdateDocument(
      "./tspconfig.yaml",
      "linter:\n  enable:\n    '@typespec/compiler/unused-import': true",
    );
    testHost.addOrUpdateDocument("./enums.tsp", "enum MyEnum { A, B, C }");
    const mainFile = testHost.addOrUpdateDocument(
      "./main.tsp",
      'import "./enums.tsp";\n\nalias EnumValue = MyEnum.A;\nmodel Foo { bar: EnumValue; }',
    );

    await testHost.server.compile(mainFile, undefined, { mode: "full" });
    const diags = testHost.getDiagnostics("main.tsp");
    const unusedImportDiags = diags.filter((d) => d.code === "@typespec/compiler/unused-import");
    strictEqual(unusedImportDiags.length, 0);
  });

  it("does not mark import as unused when namespace member is accessed", async () => {
    const testHost = await createTestServerHost();
    testHost.addOrUpdateDocument(
      "./tspconfig.yaml",
      "linter:\n  enable:\n    '@typespec/compiler/unused-import': true",
    );
    testHost.addOrUpdateDocument(
      "./ns.tsp",
      "namespace MyNamespace { model Model1 { prop: string; } }",
    );
    const mainFile = testHost.addOrUpdateDocument(
      "./main.tsp",
      'import "./ns.tsp";\n\nmodel Foo { bar: MyNamespace.Model1; }',
    );

    await testHost.server.compile(mainFile, undefined, { mode: "full" });
    const diags = testHost.getDiagnostics("main.tsp");
    const unusedImportDiags = diags.filter((d) => d.code === "@typespec/compiler/unused-import");
    strictEqual(unusedImportDiags.length, 0);
  });

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
