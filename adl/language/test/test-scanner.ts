import { strictEqual } from 'assert';
import { readFile } from 'fs/promises';
import { URL } from 'url';
import { Kind, Position, Scanner } from '../compiler/scanner.js';

type TokenEntry = [Kind, string?, Position?];

function tokens(text: string): Array<TokenEntry> {
  const scanner = new Scanner(text);
  const result: Array<TokenEntry> = [];
  do {
    const token = scanner.scan();
    strictEqual(token, scanner.token);
    result.push([
      scanner.token,
      scanner.value,
      scanner.positionFromOffset(scanner.offset)
    ]);
  } while (!scanner.eof);

  // verify that the input matches the output
  const out = result.map(each => each[1]).join('');
  strictEqual(out, text, 'Input text should match parsed token values');

  return result;
}

function dump(tokens: Array<any>) {
  //console.log(tokens.map(each => JSON.stringify(each, undefined, 2)).join('\n'));
  console.log(tokens.map(each => JSON.stringify(each[1])).join('\n'));
}


function verify(tokens: Array<TokenEntry>, expecting: Array<TokenEntry>) {
  for (const [index, [expectedToken, expectedValue]] of expecting.entries()) {
    const [token, value] = tokens[index];
    strictEqual(Kind[token], Kind[expectedToken], `Token ${index} must match`);

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
      [Kind.Whitespace],
      [Kind.Identifier, 'this'],
      [Kind.Whitespace],
      [Kind.Identifier, 'is'],
      [Kind.Whitespace],
      [Kind.Identifier, 'a'],
      [Kind.Whitespace],
      [Kind.Identifier, 'test'],
    ]);
  });

  it('scans objects', () => {
    const all = tokens('model Foo{x:y}');

    verify(all, [
      [Kind.ModelKeyword],
      [Kind.Whitespace],
      [Kind.Identifier, 'Foo'],
      [Kind.OpenBrace],
      [Kind.Identifier, 'x'],
      [Kind.Colon],
      [Kind.Identifier, 'y'],
      [Kind.CloseBrace]
    ]);
  });

  it('scans decorator expressions', () => {
    const all = tokens('@foo(1,"hello",foo)');

    verify(all, [
      [Kind.At],
      [Kind.Identifier, 'foo'],
      [Kind.OpenParen],
      [Kind.NumericLiteral, '1'],
      [Kind.Comma],
      [Kind.StringLiteral, '"hello"'],
      [Kind.Comma],
      [Kind.Identifier],
      [Kind.CloseParen]
    ]);
  });

  it('does not scan greater-than-equals as one operator', () => {
    const all = tokens('x>=y');
    verify(all, [
      [Kind.Identifier],
      [Kind.GreaterThan],
      [Kind.Equals],
      [Kind.Identifier]
    ]);
  });

  it('rescans >=', () => {
    const scanner = new Scanner('x>=y');
    scanner.scan();
    strictEqual(scanner.scan(), Kind.GreaterThan);
    strictEqual(scanner.rescanGreaterThan(), Kind.GreaterThanEquals);
  });

  it('rescans >>=', () => {
    const scanner = new Scanner('x>>=');
    scanner.scan();
    strictEqual(scanner.scan(), Kind.GreaterThan);
    strictEqual(scanner.rescanGreaterThan(), Kind.GreaterThanGreaterThanEquals);
  });

  it('rescans >>', () => {
    const scanner = new Scanner('x>>y');
    scanner.scan();
    strictEqual(scanner.scan(), Kind.GreaterThan);
    strictEqual(scanner.rescanGreaterThan(), Kind.GreaterThanGreaterThan);
  });

  function scanString(text: string, expectedValue: string, expectedToken: Kind) {
    const scanner = new Scanner(text);
    strictEqual(scanner.scan(), expectedToken);
    strictEqual(scanner.token, expectedToken);
    strictEqual(scanner.value, text);
    strictEqual(scanner.stringValue, expectedValue);
  }

  it('scans strings single-line strings with escape sequences', () => {
    scanString('"Hello world\\r\\n\\t"', 'Hello world\r\n\t', Kind.StringLiteral);
  });

  it('scans multi-line strings', () => {
    scanString('`More\r\nthan\r\none\r\nline`', 'More\nthan\none\nline', Kind.StringLiteral);
  });

  it('scans triple-quoted strings', () => {
    scanString(
      `"""   
      This is a triple-quoted string

  
      
      And this is another line
      """`,
      // NOTE: sloppy blank line formatting and trailing whitespace after open
      //       quotes above is deliberately tolerated.
      'This is a triple-quoted string\n\n\n\nAnd this is another line',
      Kind.TripleQuotedStringLiteral);
  });

  it('parses this file', async () => {
    const text = await readFile(new URL(import.meta.url), 'utf-8');
    const all = tokens(text);
  });
});
