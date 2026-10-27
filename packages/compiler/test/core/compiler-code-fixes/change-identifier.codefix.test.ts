import { strictEqual } from "assert";
import { it } from "vitest";
import { SyntaxKind } from "../../../src/ast/index.js";
import { createChangeIdentifierCodeFix } from "../../../src/core/compiler-code-fixes/change-identifier.codefix.js";
import { expectCodeFixOnAst } from "../../../src/testing/code-fix-testing.js";

it("it change identifier", async () => {
  await expectCodeFixOnAst(
    `
      model Foo {
        a: ┆number;
      }
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.Identifier);
      return createChangeIdentifierCodeFix(node, "int32");
    },
  ).toChangeTo(`
      model Foo {
        a: int32;
      }
    `);
});
