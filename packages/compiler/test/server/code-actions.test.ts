import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { CodeActionKind, Range } from "vscode-languageserver";
import { createTestServerHost } from "../../src/testing/test-server-host.js";

describe("getCodeActions", () => {
  describe("Fix all: X actions", () => {
    it("shows 'Fix all: X' action when same codefix appears multiple times in the file", async () => {
      const testHost = await createTestServerHost();
      testHost.addOrUpdateDocument("./sub.tsp", "namespace Foo; model FooModel {};");
      testHost.addOrUpdateDocument("./sub2.tsp", "namespace Bar; model BarModel {};");
      const mainFile = testHost.addOrUpdateDocument(
        "./main.tsp",
        'import "./sub.tsp";\nimport "./sub2.tsp";\nusing Foo;\nusing Bar;',
      );

      await testHost.server.compile(mainFile, undefined, { mode: "full" });
      const diags = testHost.getDiagnostics("main.tsp");

      // Both "using Foo" and "using Bar" are unused → 2 diagnostics with same codefix id
      ok(diags.length >= 2, `Expected at least 2 diagnostics, got ${diags.length}`);

      const actions = await testHost.server.getCodeActions({
        textDocument: { uri: testHost.getURL("main.tsp") },
        range: Range.create(0, 0, 0, 0),
        context: { diagnostics: [diags[0]] },
      });

      // Should include an individual fix
      ok(
        actions.some((a) => a.kind === CodeActionKind.QuickFix && !a.data?.fixAllInFile),
        "Expected an individual QuickFix action",
      );

      // Should include a "Fix all: Remove unused code" action
      const fixAllAction = actions.find(
        (a) => a.kind === CodeActionKind.QuickFix && a.data?.fixAllInFile !== undefined,
      );
      ok(fixAllAction, "Expected a 'Fix all' code action");
      strictEqual(fixAllAction.title, "Fix all: Remove unused code");
    });

    it("does NOT show 'Fix all: X' action when codefix only appears once in the file", async () => {
      const testHost = await createTestServerHost();
      testHost.addOrUpdateDocument("./sub.tsp", "namespace Foo; model FooModel {};");
      const mainFile = testHost.addOrUpdateDocument(
        "./main.tsp",
        'import "./sub.tsp";\nusing Foo;',
      );

      await testHost.server.compile(mainFile, undefined, { mode: "full" });
      const diags = testHost.getDiagnostics("main.tsp");

      ok(diags.length >= 1, `Expected at least 1 diagnostic, got ${diags.length}`);

      const actions = await testHost.server.getCodeActions({
        textDocument: { uri: testHost.getURL("main.tsp") },
        range: Range.create(0, 0, 0, 0),
        context: { diagnostics: [diags[0]] },
      });

      // Should include individual fix but NOT "Fix all"
      ok(
        actions.some((a) => a.kind === CodeActionKind.QuickFix),
        "Expected a QuickFix action",
      );
      ok(
        !actions.some((a) => a.data?.fixAllInFile !== undefined),
        "Should NOT have a 'Fix all' action when codefix only appears once",
      );
    });
  });

  describe("resolveCodeAction for Fix all", () => {
    it("resolves 'Fix all: X' action applying all instances in the file", async () => {
      const testHost = await createTestServerHost();
      testHost.addOrUpdateDocument("./sub.tsp", "namespace Foo; model FooModel {};");
      testHost.addOrUpdateDocument("./sub2.tsp", "namespace Bar; model BarModel {};");
      const mainFile = testHost.addOrUpdateDocument(
        "./main.tsp",
        'import "./sub.tsp";\nimport "./sub2.tsp";\nusing Foo;\nusing Bar;',
      );

      await testHost.server.compile(mainFile, undefined, { mode: "full" });
      const diags = testHost.getDiagnostics("main.tsp");

      ok(diags.length >= 2, `Expected at least 2 diagnostics, got ${diags.length}`);

      const actions = await testHost.server.getCodeActions({
        textDocument: { uri: testHost.getURL("main.tsp") },
        range: Range.create(0, 0, 0, 0),
        context: { diagnostics: [diags[0]] },
      });

      const fixAllAction = actions.find((a) => a.data?.fixAllInFile !== undefined);
      ok(fixAllAction, "Expected a 'Fix all' code action");

      const resolved = await testHost.server.resolveCodeAction(fixAllAction);
      ok(resolved.edit, "Expected code action edit to be populated");
      ok(
        resolved.edit.documentChanges && resolved.edit.documentChanges.length > 0,
        "Expected document changes",
      );

      // Should contain edits (both "using Foo" and "using Bar" removal)
      const edits = resolved.edit.documentChanges!.filter(
        (c): c is { textDocument: any; edits: any[] } => "edits" in c,
      );
      const totalEdits = edits.reduce((sum, e) => sum + e.edits.length, 0);
      ok(totalEdits >= 2, `Expected at least 2 text edits, got ${totalEdits}`);
    });
  });
});
