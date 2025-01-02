import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { createJsonToValuesCodeFix } from "../../../src/core/compiler-code-fixes/json-to-values.codefix.js";
import { SyntaxKind } from "../../../src/index.js";
import { expectCodeFixOnAst } from "../../../src/testing/code-fix-testing.js";

describe("CodeFix: convert-json-to-value", () => {
  it("it's missing properties, remove the quotes around property names that contain quotes", async () => {
    await expectCodeFixOnAst(
      `
      @example(┆#{"Baz": "Hello"})
      model FooBar { Baz : string; }
    `,
      (node) => {
        strictEqual(node.kind, SyntaxKind.ObjectLiteral);
        return createJsonToValuesCodeFix(node);
      },
    ).toChangeTo(`
      @example(#{Baz: "Hello"})
      model FooBar { Baz : string; }
    `);
  });
});
