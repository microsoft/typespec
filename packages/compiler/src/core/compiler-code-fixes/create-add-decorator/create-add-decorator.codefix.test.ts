import { strictEqual } from "assert";
import { it } from "vitest";
import { expectCodeFixOnAst } from "../../../testing/code-fix-testing.js";
import { SyntaxKind } from "../../types.js";
import { createAddDecoratorCodeFix } from "./create-add-decorator.codefix.js";

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
