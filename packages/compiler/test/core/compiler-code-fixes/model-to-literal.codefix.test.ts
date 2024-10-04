import { strictEqual } from "assert";
import { it } from "vitest";
import { createModelToObjectValueCodeFix } from "../../../src/core/compiler-code-fixes/model-to-object-literal.codefix.js";
import { SyntaxKind } from "../../../src/index.js";
import { expectCodeFixOnAst } from "../../../src/testing/code-fix-testing.js";

it("it change model expression to an object value", async () => {
  await expectCodeFixOnAst(
    `
      model Foo {
        a: string[] = ┆{foo: "abc"};
      }
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.ModelExpression);
      return createModelToObjectValueCodeFix(node);
    },
  ).toChangeTo(`
      model Foo {
        a: string[] = #{foo: "abc"};
      }
    `);
});
