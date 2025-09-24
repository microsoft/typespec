import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { SyntaxKind } from "../../../src/ast/index.js";
import { createSuppressCodeFix } from "../../../src/core/compiler-code-fixes/suppress.codefix.js";
import { expectCodeFixOnAst } from "../../../src/testing/code-fix-testing.js";

describe("CodeFix: suppress", () => {
  it("it suppress in previous line", async () => {
    await expectCodeFixOnAst(
      `
      model ┆Foo {
      }
    `,
      (node) => {
        strictEqual(node.kind, SyntaxKind.Identifier);
        return createSuppressCodeFix(node, "foo");
      },
    ).toChangeTo(`
      #suppress "foo" ""
      model Foo {
      }
    `);
  });

  it("it suppress for model property", async () => {
    await expectCodeFixOnAst(
      `
      model Foo {
        a: ┆int32;
      }
    `,
      (node) => {
        strictEqual(node.kind, SyntaxKind.Identifier);
        return createSuppressCodeFix(node, "foo");
      },
    ).toChangeTo(`
      model Foo {
        #suppress "foo" ""
        a: int32;
      }
    `);
  });

  it("it suppress for model property with message", async () => {
    await expectCodeFixOnAst(
      `
      model Foo {
        a: ┆int32;
      }
    `,
      (node) => {
        strictEqual(node.kind, SyntaxKind.Identifier);
        return createSuppressCodeFix(node, "foo", "This is a message");
      },
    ).toChangeTo(`
      model Foo {
        #suppress "foo" "This is a message"
        a: int32;
      }
    `);
  });
});
