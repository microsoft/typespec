import { beforeEach, describe, expect, it } from "vitest";
import { CodeAction, CodeActionKind, Diagnostic, Range } from "vscode-languageserver";
import { createTestServerHost, TestServerHost } from "../../src/testing/test-server-host.js";

let host: TestServerHost;

beforeEach(async () => {
  host = await createTestServerHost();
});

/** Add the given files, compile `main.tsp` and return its diagnostics. */
async function compileAndGetDiagnostics(
  files: Record<string, string>,
): Promise<readonly Diagnostic[]> {
  let mainFile;
  for (const [path, content] of Object.entries(files)) {
    const doc = host.addOrUpdateDocument(path, content);
    if (path.endsWith("main.tsp")) {
      mainFile = doc;
    }
  }

  await host.server.compile(mainFile!, undefined, { mode: "full" });
  return host.getDiagnostics("main.tsp");
}

function getCodeActions(diagnostics: Diagnostic[]): Promise<CodeAction[]> {
  return host.server.getCodeActions({
    textDocument: { uri: host.getURL("main.tsp") },
    range: Range.create(0, 0, 0, 0),
    context: { diagnostics },
  });
}

describe("Fix all: X actions", () => {
  it("shows 'Fix all: X' action when same codefix appears multiple times in the file", async () => {
    const diags = await compileAndGetDiagnostics({
      "./sub.tsp": "namespace Foo; model FooModel {};",
      "./sub2.tsp": "namespace Bar; model BarModel {};",
      "./main.tsp": 'import "./sub.tsp";\nimport "./sub2.tsp";\nusing Foo;\nusing Bar;',
    });

    // Both "using Foo" and "using Bar" are unused → 2 diagnostics with same codefix id
    expect(diags.length).toBeGreaterThanOrEqual(2);

    const actions = await getCodeActions([diags[0]]);

    // Should include an individual fix
    expect(actions.some((a) => a.kind === CodeActionKind.QuickFix && !a.data?.fixAllInFile)).toBe(
      true,
    );

    // Should include a "Fix all: Remove unused code" action
    const fixAllAction = actions.find(
      (a) => a.kind === CodeActionKind.QuickFix && a.data?.fixAllInFile !== undefined,
    );
    expect(fixAllAction).toBeDefined();
    expect(fixAllAction?.title).toBe("Fix all: Remove unused code");
  });

  it("does NOT show 'Fix all: X' action when codefix only appears once in the file", async () => {
    const diags = await compileAndGetDiagnostics({
      "./sub.tsp": "namespace Foo; model FooModel {};",
      "./main.tsp": 'import "./sub.tsp";\nusing Foo;',
    });

    expect(diags.length).toBeGreaterThanOrEqual(1);

    const actions = await getCodeActions([diags[0]]);

    // Should include individual fix but NOT "Fix all"
    expect(actions.some((a) => a.kind === CodeActionKind.QuickFix)).toBe(true);
    expect(actions.some((a) => a.data?.fixAllInFile !== undefined)).toBe(false);
  });
});

describe("resolveCodeAction for Fix all", () => {
  it("resolves 'Fix all: X' action applying all instances in the file", async () => {
    const diags = await compileAndGetDiagnostics({
      "./sub.tsp": "namespace Foo; model FooModel {};",
      "./sub2.tsp": "namespace Bar; model BarModel {};",
      "./main.tsp": 'import "./sub.tsp";\nimport "./sub2.tsp";\nusing Foo;\nusing Bar;',
    });

    expect(diags.length).toBeGreaterThanOrEqual(2);

    const actions = await getCodeActions([diags[0]]);
    const fixAllAction = actions.find((a) => a.data?.fixAllInFile !== undefined);
    expect(fixAllAction).toBeDefined();

    const resolved = await host.server.resolveCodeAction(fixAllAction!);
    expect(resolved.edit?.documentChanges?.length).toBeGreaterThan(0);

    // Should contain edits (both "using Foo" and "using Bar" removal)
    const edits = resolved.edit!.documentChanges!.filter(
      (c): c is { textDocument: any; edits: any[] } => "edits" in c,
    );
    const totalEdits = edits.reduce((sum, e) => sum + e.edits.length, 0);
    expect(totalEdits).toBeGreaterThanOrEqual(2);
  });
});
