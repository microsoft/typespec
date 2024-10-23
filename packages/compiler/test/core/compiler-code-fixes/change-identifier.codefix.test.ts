import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { createChangeIdentifierCodeFix } from "../../../src/core/compiler-code-fixes/change-identifier.codefix.js";
import { SyntaxKind } from "../../../src/index.js";
import { expectCodeFixOnAst } from "../../../src/testing/code-fix-testing.js";

describe("CodeFix: change-identifier", () => {
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
});
