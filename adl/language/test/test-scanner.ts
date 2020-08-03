import { strictEqual } from 'assert';
import { readFile } from 'fs/promises';
import { describe, it } from 'mocha';
import { Kind, Position, Scanner } from '../scanner';

type TokenEntry = [Kind, string?, "error"?, Position?];

function tokens(text: string): TokenEntry[] {
  const scanner = new Scanner(text);
  const result: TokenEntry[] = [];
  do {
    const token = scanner.scan();
    result.push([
      scanner.token,
      scanner.value,
      scanner.state,
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


function verify(tokens: TokenEntry[], expecting: TokenEntry[]) {
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
    ])
  })

  it('scans decorator expressions', () => {
    const all = tokens('@foo(1,"hello",foo)');

    verify(all, [
      [Kind.At],
      [Kind.Identifier, "foo"],
      [Kind.OpenParen],
      [Kind.NumericLiteral, "1"],
      [Kind.Comma],
      [Kind.StringLiteral, '"hello"'],
      [Kind.Comma],
      [Kind.Identifier],
      [Kind.CloseParen]
    ])
  })
  /** verifies that this compiled js file parses tokens that are the same as the input.  */
  it('parses this file', async () => {
    const text = await readFile(__filename, 'utf-8');
    const all = tokens(text);
  });
});