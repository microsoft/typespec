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

it("it suppress parent model when expression is array", async () => {
  await expectCodeFixOnAst(
    `
      model Foo {
      }

      model Bar {
      }

      model FooBarArray
        is ┆(Foo | Bar)[];
    `,
    (node) => createSuppressCodeFix(node, "foo"),
  ).toChangeTo(`
      model Foo {
      }

      model Bar {
      }

      #suppress "foo" ""
      model FooBarArray
        is (Foo | Bar)[];
    `);
});

it("it suppress parent model when expression is tuple", async () => {
  await expectCodeFixOnAst(
    `
      model Foo {
      }

      model Bar {
      }

      model FooBarTuple
        is ┆[Foo, Bar];
    `,
    (node) => createSuppressCodeFix(node, "foo"),
  ).toChangeTo(`
      model Foo {
      }

      model Bar {
      }

      #suppress "foo" ""
      model FooBarTuple
        is [Foo, Bar];
    `);
});

it("it suppress parent model when expression is type of", async () => {
  await expectCodeFixOnAst(
    `
      model Foo {
      }

      model FooBarTypeOf
        is ┆typeof Foo;
    `,
    (node) => createSuppressCodeFix(node, "foo"),
  ).toChangeTo(`
      model Foo {
      }

      #suppress "foo" ""
      model FooBarTypeOf
        is typeof Foo;
    `);
});

it("it suppress parent model when expression is value of", async () => {
  await expectCodeFixOnAst(
    `
      model Foo {
      }

      model FooBarValueOf
        is ┆valueof Foo;
    `,
    (node) => createSuppressCodeFix(node, "foo"),
  ).toChangeTo(`
      model Foo {
      }

      #suppress "foo" ""
      model FooBarValueOf
        is valueof Foo;
    `);
});

it("it suppress parent model when expression is call", async () => {
  await expectCodeFixOnAst(
    `
      scalar Foo extends string;

      model FooBarCall
        is ┆Foo("bar");
    `,
    (node) => createSuppressCodeFix(node, "foo"),
  ).toChangeTo(`
      scalar Foo extends string;

      #suppress "foo" ""
      model FooBarCall
        is Foo("bar");
    `);
});
