import { strictEqual } from 'assert';
import { readFile } from 'fs/promises';
import { URL } from 'url';
import { format } from '../compiler/messages.js';
import { createScanner, throwOnError, Token } from '../compiler/scanner.js';

type TokenEntry = [Token, string?];

function tokens(text: string, onError = throwOnError): Array<TokenEntry> {
  const scanner = createScanner(text, onError);
  const result: Array<TokenEntry> = [];
  do {
    const token = scanner.scan();
    strictEqual(token, scanner.token);
    result.push([
      scanner.token,
      scanner.getTokenText(),
    ]);
  } while (!scanner.eof());

  // verify that the input matches the output
  const out = result.map(each => each[1]).join('');
  strictEqual(out, text, 'Input text should match parsed token values');

  return result;
}

function verify(tokens: Array<TokenEntry>, expecting: Array<TokenEntry>) {
  for (const [index, [expectedToken, expectedValue]] of expecting.entries()) {
    const [token, value] = tokens[index];
    strictEqual(Token[token], Token[expectedToken], `Token ${index} must match`);

    if (expectedValue) {
      strictEqual(value, expectedValue, `Token ${index} value must match`);
    }
  }
}

describe('scanner', () => {
  /** verifies that we can scan tokens and get back some output. */
  it('smoketest', () => {
    const all = tokens('\tthis is  a test');
    verify(all, [
      [Token.Whitespace],
      [Token.Identifier, 'this'],
      [Token.Whitespace],
      [Token.Identifier, 'is'],
      [Token.Whitespace],
      [Token.Identifier, 'a'],
      [Token.Whitespace],
      [Token.Identifier, 'test'],
    ]);
  });

  it('scans objects', () => {
    const all = tokens('model Foo{x:y}');

    verify(all, [
      [Token.ModelKeyword],
      [Token.Whitespace],
      [Token.Identifier, 'Foo'],
      [Token.OpenBrace],
      [Token.Identifier, 'x'],
      [Token.Colon],
      [Token.Identifier, 'y'],
      [Token.CloseBrace]
    ]);
  });

  it('scans decorator expressions', () => {
    const all = tokens('@foo(1,"hello",foo)');

    verify(all, [
      [Token.At],
      [Token.Identifier, 'foo'],
      [Token.OpenParen],
      [Token.NumericLiteral, '1'],
      [Token.Comma],
      [Token.StringLiteral, '"hello"'],
      [Token.Comma],
      [Token.Identifier],
      [Token.CloseParen]
    ]);
  });

  it('does not scan greater-than-equals as one operator', () => {
    const all = tokens('x>=y');
    verify(all, [
      [Token.Identifier],
      [Token.GreaterThan],
      [Token.Equals],
      [Token.Identifier]
    ]);
  });

  it('scans numeric literals', () => {
    const all = tokens('42 0xBEEF 0b1010 1.5e4 314.0e-2 1e+1000');
    verify(all, [
      [Token.NumericLiteral, '42'],
      [Token.Whitespace],
      [Token.NumericLiteral, '0xBEEF'],
      [Token.Whitespace],
      [Token.NumericLiteral, '0b1010'],
      [Token.Whitespace],
      [Token.NumericLiteral, '1.5e4'],
      [Token.Whitespace],
      [Token.NumericLiteral, '314.0e-2'],
      [Token.Whitespace],
      [Token.NumericLiteral, '1e+1000'],
    ]);
  });

  function scanString(text: string, expectedValue: string) {
    const scanner = createScanner(text, (msg, params) => { throw new Error(format(msg.text, ...params)); });
    strictEqual(scanner.scan(), Token.StringLiteral);
    strictEqual(scanner.token, Token.StringLiteral);
    strictEqual(scanner.getTokenText(), text);
    strictEqual(scanner.getTokenValue(), expectedValue);
  }

  it('scans strings single-line strings with escape sequences', () => {
    scanString(
      '"Hello world \\r\\n \\t \\" \\\\ !"',
      'Hello world \r\n \t " \\ !');
  });

  it('scans multi-line strings', () => {
    scanString(
      '"More\r\nthan\r\none\r\nline"',
      'More\nthan\none\nline');
  });

  it('scans triple-quoted strings', () => {
    scanString(
      `"""   
      This is a triple-quoted string

  
      
      And this is another line
      """`,
      // NOTE: sloppy blank line formatting and trailing whitespace after open
      //       quotes above is deliberately tolerated.
      'This is a triple-quoted string\n\n\n\nAnd this is another line');
  });

  it('scans this file', async () => {
    const text = await readFile(new URL(import.meta.url), 'utf-8');
    tokens(text, function(msg, params) { /* ignore errors */});
  });
});
