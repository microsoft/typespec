import assert from "assert";
import { readFile } from "fs/promises";
import { URL } from "url";
import { throwOnError } from "../compiler/diagnostics.js";
import {
  createScanner,
  isKeyword,
  isPunctuation,
  isStatementKeyword,
  Keywords,
  Token,
  TokenDisplay,
} from "../compiler/scanner.js";
import { LineAndCharacter } from "../compiler/types.js";

type TokenEntry = [Token, string?, number?, LineAndCharacter?];

function tokens(text: string, onError = throwOnError): TokenEntry[] {
  const scanner = createScanner(text, onError);
  const result: TokenEntry[] = [];
  do {
    const token = scanner.scan();
    assert.strictEqual(token, scanner.token);
    result.push([
      scanner.token,
      scanner.getTokenText(),
      scanner.tokenPosition,
      scanner.file.getLineAndCharacterOfPosition(scanner.tokenPosition),
    ]);
  } while (!scanner.eof());

  // verify that the input matches the output
  const out = result.map((each) => each[1]).join("");
  assert.strictEqual(out, text, "Input text should match parsed token values");

  return result;
}

function verify(tokens: TokenEntry[], expecting: TokenEntry[]) {
  for (const [
    index,
    [expectedToken, expectedText, expectedPosition, expectedLineAndCharacter],
  ] of expecting.entries()) {
    const [token, text, position, lineAndCharacter] = tokens[index];
    assert.strictEqual(Token[token], Token[expectedToken], `Token ${index} must match`);

    if (expectedText) {
      assert.strictEqual(text, expectedText, `Token ${index} test must match`);
    }

    if (expectedPosition) {
      assert.strictEqual(position, expectedPosition, `Token ${index} position must match`);
    }

    if (expectedLineAndCharacter) {
      assert.deepStrictEqual(
        lineAndCharacter,
        expectedLineAndCharacter,
        `Token ${index} line and character must match`
      );
    }
  }
}

describe("scanner", () => {
  /** verifies that we can scan tokens and get back some output. */
  it("smoketest", () => {
    const all = tokens("\tthis is  a test");
    verify(all, [
      [Token.Whitespace],
      [Token.Identifier, "this"],
      [Token.Whitespace],
      [Token.Identifier, "is"],
      [Token.Whitespace],
      [Token.Identifier, "a"],
      [Token.Whitespace],
      [Token.Identifier, "test"],
    ]);
  });

  it("scans objects", () => {
    const all = tokens("model Foo{x:y}");

    verify(all, [
      [Token.ModelKeyword],
      [Token.Whitespace],
      [Token.Identifier, "Foo"],
      [Token.OpenBrace],
      [Token.Identifier, "x"],
      [Token.Colon],
      [Token.Identifier, "y"],
      [Token.CloseBrace],
    ]);
  });

  it("scans decorator expressions", () => {
    const all = tokens('@foo(1,"hello",foo)');

    verify(all, [
      [Token.At],
      [Token.Identifier, "foo"],
      [Token.OpenParen],
      [Token.NumericLiteral, "1"],
      [Token.Comma],
      [Token.StringLiteral, '"hello"'],
      [Token.Comma],
      [Token.Identifier],
      [Token.CloseParen],
    ]);
  });

  it("scans extends keyword", () => {
    const all = tokens("model foo extends bar{}");
    verify(all, [
      [Token.ModelKeyword],
      [Token.Whitespace],
      [Token.Identifier, "foo"],
      [Token.Whitespace],
      [Token.ExtendsKeyword],
      [Token.Whitespace],
      [Token.Identifier, "bar"],
      [Token.OpenBrace],
      [Token.CloseBrace],
    ]);
  });
  it("does not scan greater-than-equals as one operator", () => {
    const all = tokens("x>=y");
    verify(all, [[Token.Identifier], [Token.GreaterThan], [Token.Equals], [Token.Identifier]]);
  });

  it("scans numeric literals", () => {
    const all = tokens("42 0xBEEF 0b1010 1.5e4 314.0e-2 1e+1000");
    verify(all, [
      [Token.NumericLiteral, "42"],
      [Token.Whitespace],
      [Token.NumericLiteral, "0xBEEF"],
      [Token.Whitespace],
      [Token.NumericLiteral, "0b1010"],
      [Token.Whitespace],
      [Token.NumericLiteral, "1.5e4"],
      [Token.Whitespace],
      [Token.NumericLiteral, "314.0e-2"],
      [Token.Whitespace],
      [Token.NumericLiteral, "1e+1000"],
    ]);
  });

  function scanString(text: string, expectedValue: string) {
    const scanner = createScanner(text);
    assert.strictEqual(scanner.scan(), Token.StringLiteral);
    assert.strictEqual(scanner.token, Token.StringLiteral);
    assert.strictEqual(scanner.getTokenText(), text);
    assert.strictEqual(scanner.getTokenValue(), expectedValue);
  }

  it("scans empty strings", () => {
    scanString('""', "");
  });

  it("scans strings single-line strings with escape sequences", () => {
    scanString('"Hello world \\r\\n \\t \\" \\\\ !"', 'Hello world \r\n \t " \\ !');
  });

  it("scans multi-line strings", () => {
    scanString('"More\r\nthan\r\none\r\nline"', "More\nthan\none\nline");
  });

  it("scans triple-quoted strings", () => {
    scanString(
      `"""   
      This is a triple-quoted string

  
      
      And this is another line
      """`,
      // NOTE: sloppy blank line formatting and trailing whitespace after open
      //       quotes above is deliberately tolerated.
      "This is a triple-quoted string\n\n\n\nAnd this is another line"
    );
  });

  it("provides token position", () => {
    const all = tokens("a x\raa x\r\naaa x\naaaa x\u{2028}aaaaa x\u{2029}aaaaaa x");
    verify(all, [
      [Token.Identifier, "a", 0, { line: 0, character: 0 }],
      [Token.Whitespace, " ", 1, { line: 0, character: 1 }],
      [Token.Identifier, "x", 2, { line: 0, character: 2 }],
      [Token.NewLine, "\r", 3, { line: 0, character: 3 }],

      [Token.Identifier, "aa", 4, { line: 1, character: 0 }],
      [Token.Whitespace, " ", 6, { line: 1, character: 2 }],
      [Token.Identifier, "x", 7, { line: 1, character: 3 }],
      [Token.NewLine, "\r\n", 8, { line: 1, character: 4 }],

      [Token.Identifier, "aaa", 10, { line: 2, character: 0 }],
      [Token.Whitespace, " ", 13, { line: 2, character: 3 }],
      [Token.Identifier, "x", 14, { line: 2, character: 4 }],
      [Token.NewLine, "\n", 15, { line: 2, character: 5 }],

      [Token.Identifier, "aaaa", 16, { line: 3, character: 0 }],
      [Token.Whitespace, " ", 20, { line: 3, character: 4 }],
      [Token.Identifier, "x", 21, { line: 3, character: 5 }],
      [Token.NewLine, "\u{2028}", 22, { line: 3, character: 6 }],

      [Token.Identifier, "aaaaa", 23, { line: 4, character: 0 }],
      [Token.Whitespace, " ", 28, { line: 4, character: 5 }],
      [Token.Identifier, "x", 29, { line: 4, character: 6 }],
      [Token.NewLine, "\u{2029}", 30, { line: 4, character: 7 }],

      [Token.Identifier, "aaaaaa", 31, { line: 5, character: 0 }],
      [Token.Whitespace, " ", 37, { line: 5, character: 6 }],
      [Token.Identifier, "x", 38, { line: 5, character: 7 }],
    ]);
  });

  // It's easy to forget to update TokenDisplay or Min/Max ranges...
  it("provides friendly token display and classification", () => {
    const tokenCount = Object.values(Token).filter((v) => typeof v === "number").length;
    const tokenDisplayCount = TokenDisplay.length;
    assert.strictEqual(
      tokenCount,
      tokenDisplayCount,
      `Token enum has ${tokenCount} elements but TokenDisplay array has ${tokenDisplayCount}.`
    );

    // check that keywords have appropriate display
    const nonStatementKeywords = [Token.ExtendsKeyword, Token.TrueKeyword, Token.FalseKeyword];
    for (const [name, token] of Keywords.entries()) {
      assert.strictEqual(TokenDisplay[token], `'${name}'`);
      assert(isKeyword(token), `${name} should be classified as a keyword`);
      if (!nonStatementKeywords.includes(token)) {
        assert(isStatementKeyword(token), `${name} should be classified as statement keyword`);
      }
    }

    // check single character punctuation
    for (let i = 33; i <= 126; i++) {
      const str = String.fromCharCode(i);
      const token = createScanner(str, () => ({})).scan();
      if (
        token !== Token.StringLiteral &&
        token !== Token.Identifier &&
        token !== Token.Unknown &&
        token !== Token.NumericLiteral
      ) {
        assert.strictEqual(TokenDisplay[token], `'${str}'`);
        assert(isPunctuation(token), `'${str}' should be classified as punctuation`);
      }
    }

    // check the rest
    assert.strictEqual(TokenDisplay[Token.Elipsis], "'...'");
    assert.strictEqual(TokenDisplay[Token.None], "<none>");
    assert.strictEqual(TokenDisplay[Token.Unknown], "<unknown>");
    assert.strictEqual(TokenDisplay[Token.EndOfFile], "<end of file>");
    assert.strictEqual(TokenDisplay[Token.SingleLineComment], "<single-line comment>");
    assert.strictEqual(TokenDisplay[Token.MultiLineComment], "<multi-line comment>");
    assert.strictEqual(TokenDisplay[Token.NewLine], "<newline>");
    assert.strictEqual(TokenDisplay[Token.Whitespace], "<whitespace>");
    assert.strictEqual(TokenDisplay[Token.ConflictMarker], "<conflict marker>");
    assert.strictEqual(TokenDisplay[Token.Identifier], "<identifier>");
  });

  it("scans this file", async () => {
    const text = await readFile(new URL(import.meta.url), "utf-8");
    tokens(text, function () {
      /* ignore errors */
    });
  });
});
