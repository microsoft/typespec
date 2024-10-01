import { strictEqual } from "assert";
import { it } from "vitest";
import { createTupleToArrayValueCodeFix } from "../../../src/core/compiler-code-fixes/tuple-to-array-value.codefix.js";
import { SyntaxKind } from "../../../src/index.js";
import { expectCodeFixOnAst } from "../../../src/testing/code-fix-testing.js";

it("it change tuple to a array value", async () => {
  await expectCodeFixOnAst(
    `
      model Foo {
        a: string[] = ┆["abc"];
      }
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.TupleExpression);
      return createTupleToArrayValueCodeFix(node);
    },
  ).toChangeTo(`
      model Foo {
        a: string[] = #["abc"];
      }
    `);
});
