import { strictEqual } from 'assert';
import { readFile } from 'fs/promises';
import { describe, it } from 'mocha';
import { Kind, Scanner } from '../scanner';


function tokens(text: string) {
  const scanner = new Scanner(text);
  const result = [];
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


function verify(tokens: Array<any>, expecting: Array<any>) {
  for (const each in expecting) {
    const token = tokens[each];
    const expected = expecting[each];
    if (expected) {
      for (const e in expected) {
        strictEqual(token[e], expected[e], 'Must Match');
      }
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
  })

  /** verifies that this compiled js file parses tokens that are the same as the input.  */
  it('parses this file', async () => {
    const text = await readFile(__filename, 'utf-8');
    const all = tokens(text);
  })
})