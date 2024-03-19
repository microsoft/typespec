import { strictEqual } from "assert";
import { it } from "vitest";
import { createModelToLiteralCodeFix } from "../../../src/core/compiler-code-fixes/model-to-literal.codefix.js";
import { SyntaxKind } from "../../../src/index.js";
import { expectCodeFixOnAst } from "../../../src/testing/code-fix-testing.js";

it("it change model expression to an object literal", async () => {
  await expectCodeFixOnAst(
    `
      model Foo {
        a: string[] = ┆{foo: "abc"};
      }
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.ModelExpression);
      return createModelToLiteralCodeFix(node);
    }
  ).toChangeTo(`
      model Foo {
        a: string[] = #{foo: "abc"};
      }
    `);
});
