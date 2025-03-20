import { strictEqual } from "assert";
import { it } from "vitest";
import { SyntaxKind } from "../../../src/ast/index.js";
import { createTripleQuoteIndentCodeFix } from "../../../src/core/compiler-code-fixes/triple-quote-indent.codefix.js";
import { getSourceLocation } from "../../../src/index.js";
import { expectCodeFixOnAst } from "../../../src/testing/code-fix-testing.js";

it("each triple-quote is on a new line", async () => {
  await expectCodeFixOnAst(
    `
    const a = ┆"""
    one
      two
        """;
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.StringLiteral);
      const target = getSourceLocation(node);
      return createTripleQuoteIndentCodeFix(target);
    },
  ).toChangeTo(`
    const a = """
        one
          two
        """;
    `);
});

it("all triple-quote is on one line", async () => {
  await expectCodeFixOnAst(
    `
      const a = ┆""" one
        two    """;
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.StringLiteral);
      const target = getSourceLocation(node);
      return createTripleQuoteIndentCodeFix(target);
    },
  ).toChangeTo(`
      const a = """
        one
               two    
        """;
    `);
});

it("all triple-quote is on one line and is no carriage return in line", async () => {
  await expectCodeFixOnAst(
    `
      const a = ┆""" one  two    """;
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.StringLiteral);
      const target = getSourceLocation(node);
      return createTripleQuoteIndentCodeFix(target);
    },
  ).toChangeTo(`
      const a = """
 one  two    
 """;
    `);
});

it("start triple-quote is not on a new line but end one is", async () => {
  await expectCodeFixOnAst(
    `
      const a = ┆"""one
        two
          """;
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.StringLiteral);
      const target = getSourceLocation(node);
      return createTripleQuoteIndentCodeFix(target);
    },
  ).toChangeTo(`
      const a = """
          one
                  two
          """;
    `);
});

it("end triple-quote is not on a new line but start one is", async () => {
  await expectCodeFixOnAst(
    `
      const a = ┆"""
        one
          two   """;
    `,
    (node) => {
      strictEqual(node.kind, SyntaxKind.StringLiteral);
      const target = getSourceLocation(node);
      return createTripleQuoteIndentCodeFix(target);
    },
  ).toChangeTo(`
      const a = """
          one
            two   
          """;
    `);
});
