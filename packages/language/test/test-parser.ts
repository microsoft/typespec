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
         'prop-1': number;
       }`,

      `
      [Foo()]
      model Car {
         [Foo.bar(10, "hello")]
         prop1: number,
         
         [Foo.baz(a, b)]
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

      'model Car { ... A, ... B, c: number, ... D, e: string }'
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
      'interface A { b(param: [number, string]): [1, "hi"] }'
    ]);
  });

  describe('array expressions', () => {
    parseEach([
      'model A { foo: B[] }'
    ]);
  });

  describe('union expressions', () => {
    parseEach([
      'model A { foo: B | C }'
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

  describe('array expressions', () => {
    parseEach([
      'model A { foo: D[] }'
    ]);
  });

  describe('union expressions', () => {
    parseEach([

      'model A { foo: B | D }'
    ]);
  });

  describe('interface statements', () => {
    parseEach([
      'interface Store {}',
      'interface Store { read(): int32 }',
      'interface Store { read(): int32, write(v: int32): {} }',
      'interface Store { read(): int32; write(v: int32): {} }',
      '@foo interface Store { @dec read():number, @dec write(n: number): {} }',
      '@foo @bar interface Store { @foo @bar read(): number; }',
      'interface Store(apiKey: string, otherArg: number) { }',
      'interface Store(... apiKeys, x: string) { foo(... A, b: string, ...C, d: number): void }'
    ]);
  });

  describe('alias statements', () => {
    parseEach([
      'alias MyAlias : SomethingElse;',
      'alias MyAlias : { constantProperty: 4 };',
      'alias MyAlias : [ string, number ];'
    ]);
  });

  describe('multiple statements', () => {
    parseEach([`
      model A { };
      model B { }
      model C = A;
      ;
      interface I {
        foo(): number;
      }
      interface J {

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

function parseEach(cases: Array<string>) {
  for (const code of cases) {
    it('parses `' + shorten(code) + '`', () => {
      dumpAST(parse(code));
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
