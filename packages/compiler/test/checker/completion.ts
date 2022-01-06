import { ok, strictEqual } from "assert";
import { resolve } from "path";
import { getNodeAtPosition } from "../../core/parser.js";
import { SyntaxKind } from "../../core/types.js";
import { createTestHost } from "../test-host.js";

describe("compiler: completion", () => {
  it("completes globals", async () => {
    const completions = await complete(
      `
      model M {
        s: ┆
      }
      `
    );

    ok(completions.length > 0, "no completions found");
    ok(completions.includes("int32"), "int32 not completed");
    ok(completions.includes("string"), "string not completed");
  });

  it("completes decorators", async () => {
    const completions = await complete(
      `
    @┆
    model M {}
    `
    );

    ok(completions.length > 0, "no completions found");
    ok(completions.includes("doc"), "doc not completed");
  });

  it("completes partial identifiers", async () => {
    const completions = await complete(
      `
      model M {
        s: stri┆
      }
      `
    );

    ok(completions.length > 0, "no completions found");
    ok(completions.includes("string"), "string not completed");
  });

  it("completes partial identifier with astral character", async () => {
    const completions = await complete(
      `
      model 𐌰𐌲𐌰𐌲𐌰𐌲 {}
      model M {
        s: 𐌰𐌲┆
      }
      `
    );

    ok(completions.length > 0, "no completions found");
    ok(completions.includes("𐌰𐌲𐌰𐌲𐌰𐌲"), "𐌰𐌲𐌰𐌲𐌰𐌲 not completed");
  });

  it("completes namespace members", async () => {
    const completions = await complete(
      `
      namespace N {
        model A {}
        model B {}
      }

      model M extends N.┆
      `
    );

    strictEqual(completions.length, 2);
    ok(completions.includes("A"), "A not completed");
    ok(completions.includes("B"), "B not completed");
  });

  it("completes template parameter uses", async () => {
    const completions = await complete(
      `
      model Template<Param> {
        prop: ┆
      }
      `
    );

    ok(completions.length > 0, "no completions found");
    ok(completions.includes("Param"), "Param not completed");
  });

  it("completes sibling in namespace", async () => {
    const completions = await complete(
      `
      namespace N {
        model A {}
        model B extends ┆
      }
        `
    );

    ok(completions.length > 0, "no completions found");
    ok(completions.includes("A"), "A not completed");
  });

  it("deals with trivia before missing identifier", async () => {
    const completions = await complete(
      `
      namespace N {
        model A {}
        model B {}
      }

      model M extends N.┆
      // single line comment
      /* 
        multi-line comment
      */
      {/*<-- missing identifier immediately before this brace*/}
      `
    );

    strictEqual(completions.length, 2);
    ok(completions.includes("A"), "A not completed");
    ok(completions.includes("B"), "B not completed");
  });

  async function complete(sourceWithCursor: string): Promise<string[]> {
    const pos = sourceWithCursor.indexOf("┆");
    ok(pos >= 0, "no cursor found");

    const source = sourceWithCursor.replace("┆", "");
    const testHost = await createTestHost();
    testHost.addCadlFile("test.cadl", source);
    await testHost.compileAndDiagnose("test.cadl");

    const path = resolve("/", "test.cadl");
    const script = testHost.program.sourceFiles.get(path);
    ok(script, "file added above not found in program.");
    const node = getNodeAtPosition(script, pos);

    ok(node?.kind === SyntaxKind.Identifier, "expected to find an identifier");
    ok(testHost.program.checker, "program should have a checker");
    return Array.from(testHost.program.checker.resolveCompletions(node).keys());
  }
});
