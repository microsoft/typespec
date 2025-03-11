import { strictEqual } from "assert";
import { it } from "vitest";
import { SyntaxKind } from "../../../src/ast/index.js";
import {
  createModelToObjectValueCodeFix,
  createTupleToArrayValueCodeFix,
} from "../../../src/core/compiler-code-fixes/convert-to-value.codefix.js";
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

it("it recursively changes the model expression to the corresponding object value", async () => {
  await expectCodeFixOnAst(
    `
      @example(┆{Bar : {Baz : "Hello"}})
      model Foo { Bar : Bar; }
      model Bar { Baz : string }
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.ModelExpression);
      return createModelToObjectValueCodeFix(node);
    },
  ).toChangeTo(`
      @example(#{Bar : #{Baz : "Hello"}})
      model Foo { Bar : Bar; }
      model Bar { Baz : string }
    `);
});

it("it recursively changes the complex model expression to the corresponding object value or array value", async () => {
  await expectCodeFixOnAst(
    `
      @example(┆{ Bar: [ {Baz: "Hello"}, [ "foo" ] ] })
      model Foo { Bar : Array<Bar|Array<string>>; }
      model Bar { Baz : string }
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.ModelExpression);
      return createModelToObjectValueCodeFix(node);
    },
  ).toChangeTo(`
      @example(#{ Bar: #[ #{Baz: "Hello"}, #[ "foo" ] ] })
      model Foo { Bar : Array<Bar|Array<string>>; }
      model Bar { Baz : string }
    `);
});

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

it("it recursively changes tuple to the corresponding array value", async () => {
  await expectCodeFixOnAst(
    `
      model Tuple {
          tuple: [ string, [ string ]] = ┆["foo", ["bar"]];
      }
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.TupleExpression);
      return createTupleToArrayValueCodeFix(node);
    },
  ).toChangeTo(`
      model Tuple {
          tuple: [ string, [ string ]] = #["foo", #["bar"]];
      }
    `);
});

it("it recursively changes the complex tuple to the corresponding object value or array value", async () => {
  await expectCodeFixOnAst(
    `
      model Bar { Baz : string }
      model Tuple {
          tuple: [ string, [ string,Bar ]] = ┆["foo", ["bar",{Baz: "Hello"}]];
      }
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.TupleExpression);
      return createTupleToArrayValueCodeFix(node);
    },
  ).toChangeTo(`
      model Bar { Baz : string }
      model Tuple {
          tuple: [ string, [ string,Bar ]] = #["foo", #["bar",#{Baz: "Hello"}]];
      }
    `);
});
