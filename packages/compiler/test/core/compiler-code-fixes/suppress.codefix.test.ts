import { strictEqual } from "assert";
import { it } from "vitest";
import { SyntaxKind } from "../../../src/ast/index.js";
import { createSuppressCodeFix } from "../../../src/core/compiler-code-fixes/suppress.codefix.js";
import { expectCodeFixOnAst } from "../../../src/testing/code-fix-testing.js";

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

it("it suppress on parent property when target is the property with multiple line", async () => {
  await expectCodeFixOnAst(
    `
      model Foo {
        a: 
          | ┆int32 
          | string;
      }
    `,
    (node) => createSuppressCodeFix(node, "foo"),
  ).toChangeTo(`
      model Foo {
        #suppress "foo" ""
        a: 
          | int32 
          | string;
      }
    `);
});

it("it suppress on parent property when target is multi line model expression", async () => {
  await expectCodeFixOnAst(
    `
      model Foo {
        a: {
          b: int32 
          c: string;
        ┆}
      }
    `,
    (node) => createSuppressCodeFix(node, "foo"),
  ).toChangeTo(`
      model Foo {
        #suppress "foo" ""
        a: {
          b: int32 
          c: string;
        }
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

it("it does suppress for model property twice", async () => {
  await expectCodeFixOnAst(
    `
      model Foo {
        #suppress "foo" ""
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
