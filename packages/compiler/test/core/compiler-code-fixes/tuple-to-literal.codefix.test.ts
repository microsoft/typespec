import { strictEqual } from "assert";
import { it } from "vitest";
import { createTupleToLiteralCodeFix } from "../../../src/core/compiler-code-fixes/tuple-to-literal.codefix.js";
import { SyntaxKind } from "../../../src/index.js";
import { expectCodeFixOnAst } from "../../../src/testing/code-fix-testing.js";

it("it change tuple to a array literal", async () => {
  await expectCodeFixOnAst(
    `
      model Foo {
        a: string[] = ┆["abc"];
      }
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.TupleExpression);
      return createTupleToLiteralCodeFix(node);
    }
  ).toChangeTo(`
      model Foo {
        a: string[] = #["abc"];
      }
    `);
});
