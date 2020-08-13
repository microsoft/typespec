import { parse } from '../parser';

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

      `
      [Foo()]
      model Car {
         [Foo.bar(10, "hello")]
         prop1: number,
         
         [Foo.baz(a, b)]
         prop2: string
       };`,

      'model Foo { "strKey": number, "😂😂😂": string }'
    ]);
  });

  describe('model = statements', () => {
    parseEach([
      'model x = y',
      'model foo = bar | baz'
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

  describe('interface statements', () => {
    parseEach([
      'interface Store {}',
      'interface Store { read(): int32 }',
      'interface Store { read(): int32, write(v: int32): {} }',
      'interface Store { read(): int32; write(v: int32): {} }',
      '@foo interface Store { @dec read():number, @dec write(n: number): {} }'
    ]);
  });

  describe('alias statements', () => {
    parseEach([
      'alias MyAlias : SomethingElse;',
      'alias MyAlias : { constantProperty: 4 };',
      'alias MyAlias : [ string, number ];'
    ]);
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
  console.log(JSON.stringify(astNode, null, 4));
}

function shorten(code: string) {
  return code.replace(/\s+/g, ' ');
}