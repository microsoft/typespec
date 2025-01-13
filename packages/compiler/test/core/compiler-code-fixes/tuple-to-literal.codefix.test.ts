import { strictEqual } from "assert";
import { it } from "vitest";
import { createTupleToArrayValueCodeFix } from "../../../src/core/compiler-code-fixes/tuple-to-array-value.codefix.js";
import { SyntaxKind } from "../../../src/index.js";
import { expectCodeFixOnAst } from "../../../src/testing/code-fix-testing.js";

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
