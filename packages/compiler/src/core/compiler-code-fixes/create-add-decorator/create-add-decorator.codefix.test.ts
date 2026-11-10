import { strictEqual } from "assert";
import { it } from "vitest";
import { expectCodeFixOnAst } from "../../../testing/code-fix-testing.js";
import { SyntaxKind } from "../../types.js";
import { createAddDecoratorCodeFix } from "./create-add-decorator.codefix.js";

it("adds a decorator to an inline property without decorating its model", async () => {
  await expectCodeFixOnAst(
    `
  model Foo { a┆: int32; b: string; }
  `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.Identifier);
      return createAddDecoratorCodeFix(node, "doc", ['"Property documentation"']);
    },
  ).toChangeTo(`
  model Foo { @doc("Property documentation") a: int32; b: string; }
  `);
});

it("keeps an inline property's existing decorators attached to that property", async () => {
  await expectCodeFixOnAst(
    `
  model Foo { @optional a┆: int32; }
  `,
    (node) => {
      const property = node.parent;
      strictEqual(property?.kind, SyntaxKind.ModelProperty);
      return createAddDecoratorCodeFix(property!, "doc", ['"Property documentation"']);
    },
  ).toChangeTo(`
  model Foo { @doc("Property documentation") @optional a: int32; }
  `);
});

it("it add decorator with single arg in line above", async () => {
  await expectCodeFixOnAst(
    `
    model Foo {
      a┆: int32;
    }
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.Identifier);
      return createAddDecoratorCodeFix(node, "doc", [`"This is a doc string."`]);
    },
  ).toChangeTo(`
    model Foo {
      @doc("This is a doc string.")
      a: int32;
    }
  `);
});

it("it add decorator with multiple args", async () => {
  await expectCodeFixOnAst(
    `
    model Foo {
      a┆: int32;
    }
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.Identifier);
      return createAddDecoratorCodeFix(node, "doc", [`"This is a doc string."`, `"Another arg"`]);
    },
  ).toChangeTo(`
    model Foo {
      @doc("This is a doc string.", "Another arg")
      a: int32;
    }
  `);
});
