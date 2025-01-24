import { strictEqual } from "assert";
import { describe, it } from "vitest";
import { createTripleQuoteIndentCodeFix } from "../../../src/core/compiler-code-fixes/triple-quote-indent.codefix.js";
import { SyntaxKind } from "../../../src/index.js";
import { expectCodeFixOnAst } from "../../../src/testing/code-fix-testing.js";

describe("CodeFix: triple-quote-indent", () => {
  it("case 1: each triple-quote is on a new line", async () => {
    await expectCodeFixOnAst(
      `
      const a = ┆"""\r\none\r\n  two\r\n  """;
    `,
      (node) => {
        strictEqual(node.kind, SyntaxKind.StringLiteral);
        return createTripleQuoteIndentCodeFix(node);
      },
    ).toChangeTo(`
      const a = """\r\n  one\r\n    two\r\n  """;
    `);
  });

  it("case 2: all triple-quote is on one line", async () => {
    await expectCodeFixOnAst(
      `
      const a = ┆""" one\r\n  two    """;
    `,
      (node) => {
        strictEqual(node.kind, SyntaxKind.StringLiteral);
        return createTripleQuoteIndentCodeFix(node);
      },
    ).toChangeTo(`
      const a = """\r\n  one\r\n   two    \r\n  """;
    `);
  });

  it("case 3: all triple-quote is on one line and is no carriage return in line", async () => {
    await expectCodeFixOnAst(
      `
      const a = ┆""" one  two    """;
    `,
      (node) => {
        strictEqual(node.kind, SyntaxKind.StringLiteral);
        return createTripleQuoteIndentCodeFix(node);
      },
    ).toChangeTo(`
      const a = """\r\n one  two    \r\n """;
    `);
  });

  it("case 4: start triple-quote is not on a new line but end one is", async () => {
    await expectCodeFixOnAst(
      `
      const a = ┆"""one\r\n  two\r\n  """;
    `,
      (node) => {
        strictEqual(node.kind, SyntaxKind.StringLiteral);
        return createTripleQuoteIndentCodeFix(node);
      },
    ).toChangeTo(`
      const a = """\r\n  one\r\n    two\r\n  """;
    `);
  });

  it("case 5: end triple-quote is not on a new line but start one is", async () => {
    await expectCodeFixOnAst(
      `
      const a = ┆"""\r\n  one\r\n  two   """;
    `,
      (node) => {
        strictEqual(node.kind, SyntaxKind.StringLiteral);
        return createTripleQuoteIndentCodeFix(node);
      },
    ).toChangeTo(`
      const a = """\r\n  one\r\n  two   \r\n  """;
    `);
  });
});
