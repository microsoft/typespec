import * as assert from 'assert';
import { parse } from '../compiler/parser.js';
import { SyntaxKind } from '../compiler/types.js';

describe('syntax', () => {
  describe('import statements', () => {
    parseEach([
      'import x;',
      'import x as { one };',
      'import x as {};',
      'import x as { one, two };'
    ]);
  });

  describe('model statements', () => {
    parseEach([
      'model Car { };',

      `@foo()
       model Car { };`,

      `model Car {
         prop1: number,
         prop2: string
       };`,

      `model Car {
         prop1: number;
         prop2: string;
       }`,

      `model Car {
          engine: V6
        }
        
        model V6 {
          name: string
        }`,

      `model Car {
         @foo.bar(a, b)
         prop1: number,
         
         @foo.baz(10, "hello")
         prop2: string
       };`,

      // parens on this decorator are currently required, otherwise it
      // parses as if it were `@foo('prop-1') : number`
      `model Car {
         @foo()
         "prop-1": number;
       }`,

      `
      @Foo()
      model Car {
         @Foo.bar(10, "hello")
         prop1: number,
         
         @Foo.baz(a, b)
         prop2: string
       };`,

      `@doc """
       Documentation
       """
       model Car {
         @doc "first"
         prop1: number;

         @doc "second"
         prop2: number;
       }`,

      'model Foo { "strKey": number, "😂😂😂": string }',

      'model Foo<A, B> { }',

      'model Car { @foo @bar x: number }',

      'model Car { ... A, ... B, c: number, ... D, e: string }',

      'model Car { ... A.B, ... C<D> }'
    ]);
  });

  describe('model extends statements', () => {
    parseEach([
      'model foo extends bar { }',
      'model foo extends bar, baz { }',
      'model foo extends bar.baz { }',
      'model foo extends bar<T> { }',
      'model foo<T> extends bar<T> { }',
      'model foo<T> extends bar.baz<T> { }'
    ]);
    parseErrorEach([
      'model foo extends { }',
      'model foo extends = { }',
      'model foo extends bar = { }'
    ]);
  });

  describe('model = statements', () => {
    parseEach([
      'model x = y;',
      'model foo = bar | baz;',
      'model bar<a, b> = a | b;'
    ]);
  });

  describe('model expressions', () => {
    parseEach([
      'model Car { engine: { type: "v8" } }'
    ]);
  });

  describe('tuple model expressions', () => {
    parseEach([
      'namespace A { op b(param: [number, string]): [1, "hi"] }'
    ]);
  });

  describe('array expressions', () => {
    parseEach([
      'model A { foo: B[] }',
      'model A { foo: B[][] }',
    ]);
  });

  describe('union expressions', () => {
    parseEach([
      'model A { foo: B | C }',
      'model A { foo: B | C & D }'
    ]);
  });

  describe('template instantiations', () => {
    parseEach([
      'model A = Foo<number, string>;',
      'model B = Foo<number, string>[];'
    ]);
  });


  describe('intersection expressions', () => {
    parseEach([
      'model A { foo: B & C }'
    ]);
  });

  describe('parenthesized expressions', () => {
    parseEach([
      'model A = ((B | C) & D)[];'
    ]);
  });

  describe('namespace statements', () => {
    parseEach([
      'namespace Store {}',
      'namespace Store { op read(): int32 }',
      'namespace Store { op read(): int32, op write(v: int32): {} }',
      'namespace Store { op read(): int32; op write(v: int32): {} }',
      '@foo namespace Store { @dec op read():number, @dec op write(n: number): {} }',
      '@foo @bar namespace Store { @foo @bar op read(): number; }',
      'namespace Store(apiKey: string, otherArg: number) { }',
      'namespace Store(... apiKeys, x: string) { op foo(... A, b: string, ...C, d: number): void }'
    ]);
  });

  describe('multiple statements', () => {
    parseEach([`
      model A { };
      model B { }
      model C = A;
      ;
      namespace I {
        op foo(): number;
      }
      namespace J {

      }


    `]);
  });

  describe('comments', () => {
    parseEach([`
      // Comment
      model A { /* Another comment */
        /*
          and
          another
        */
        property /* 👀 */ : /* 👍 */ int32; // one more
      }
      `]);
  });
});

function parseEach(cases: string[]) {
  for (const code of cases) {
    it('parses `' + shorten(code) + '`', () => {
      dumpAST(parse(code));
    });
  }
}

function parseErrorEach(cases: string[]) {
  for (const code of cases) {
    it(`doesn't parse ${shorten(code)}`, () => {
      assert.throws(() => {
        parse(code);
      })
    });
  }
}

function dumpAST(astNode: any) {
  const replacer = function(this: any, key: string, value: any) {
    return key == 'kind' ? SyntaxKind[value] : value;
  };
  console.log(JSON.stringify(astNode, replacer, 4));
}

function shorten(code: string) {
  return code.replace(/\s+/g, ' ');
}
