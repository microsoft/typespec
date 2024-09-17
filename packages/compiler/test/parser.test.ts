import assert, { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { CharCode } from "../src/core/charcode.js";
import { formatDiagnostic, logVerboseTestOutput } from "../src/core/diagnostics.js";
import { hasParseError, parse, visitChildren } from "../src/core/parser.js";
import {
  IdentifierNode,
  Node,
  ParseOptions,
  SourceFile,
  StringTemplateExpressionNode,
  SyntaxKind,
  TypeSpecScriptNode,
} from "../src/core/types.js";
import { DecorableNode } from "../src/formatter/print/types.js";
import {
  DiagnosticMatch,
  expectDiagnosticEmpty,
  expectDiagnostics,
} from "../src/testing/expect.js";
import { dumpAST } from "./ast-test-utils.js";

describe("compiler: parser", () => {
  describe("import statements", () => {
    parseEach(['import "x";']);

    parseErrorEach([
      ['namespace Foo { import "x"; }', [{ message: /Imports must be top-level/, pos: 16 }]],
      ['namespace Foo { } import "x";', [{ message: /Imports must come prior/, pos: 18 }]],
      ['model Foo { } import "x";', [{ message: /Imports must come prior/, pos: 14 }]],
      ['using Bar; import "x";', [{ message: /Imports must come prior/, pos: 11 }]],
    ]);
  });

  describe("empty script", () => {
    parseEach([["", (n) => assert.strictEqual(n.statements.length, 0)]]);
  });

  describe("model statements", () => {
    parseEach([
      "model Car { };",
      `@foo()
       model Car { };`,

      `model Car {
         prop1: number,
         prop2: string
       };`,

      `model Car {
         withDefaultButNotOptional: string = "foo"
       }`,

      `model Car {
         optional?: number;
         withDefault?: string = "my-default";
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

      `@doc("""
       Documentation
       """)
       model Car {
         @doc("first")
         prop1: number;

         @doc("second")
         prop2: number;
       }`,

      'model Foo { "strKey": number, "😂😂😂": string }',

      "model Foo<A, B> { }",

      "model Car { @foo @bar x: number }",

      "model Car { ... A, ... B, c: number, ... D, e: string }",

      "model Car { ... A.B, ... C<D> }",

      "model Car is Vehicle;",

      "model Names is string[];",
    ]);

    parseErrorEach([
      ["model Car is { }", [/';', or '{' expected./]],
      ["model Car is Foo extends Bar { }", [/'{' expected/]],
      ["model Car extends Bar is Foo { }", [/'{' expected/]],
      ["model Car { withDefaultMissing?: string =  }", [/Expression expected/]],
      ["model", [/Identifier expected/]],
      ["model Car is Vehicle", [/';', or '{' expected/]],
      ["model Car;", [/'{', '=', 'extends', or 'is' expected/]],
      ["model Car extends Foo;", [/'{' expected/]],
    ]);
  });

  describe("model extends statements", () => {
    parseEach([
      "model foo extends bar { }",
      "model foo extends bar.baz { }",
      "model foo extends bar<T> { }",
      "model foo<T> extends bar<T> { }",
      "model foo<T> extends bar.baz<T> { }",
    ]);
    parseErrorEach([
      ["model foo extends { }", [/'{' expected/]],
      ["model foo extends bar, baz { }", [/'{' expected/]],
      ["model foo extends = { }", [/Expression expected/]],
      ["model foo extends bar = { }", [/'{' expected/]],
    ]);
  });

  describe("model = statements", () => {
    parseErrorEach([
      ["model x = y;", [/'{' expected/]],
      ["model foo = bar | baz;", [/'{' expected/]],
      ["model bar<a, b> = a | b;", [/'{' expected/]],
    ]);
  });

  describe("scalar statements", () => {
    parseEach([
      "scalar uuid extends string;",
      `@foo()
      scalar uuid extends string;`,
      `namespace Foo { 
        scalar uuid extends string;}
        `,
      `scalar uuid {
        init fromString(def: string)
      }`,
      `scalar bar extends uuid {
        init fromOther(abc: string)
      }`,
    ]);

    parseErrorEach([["scalar uuid is string;", [{ message: "'{' expected." }]]]);
  });

  describe("interface statements", () => {
    parseEach([
      "interface Foo { }",
      "interface Foo<T> { }",
      "interface Foo<T> extends Bar<T> { }",
      "interface Foo extends Bar, Baz<T> { }",
      "interface Foo { foo(): int32; }",
      "interface Foo { foo(): int32; bar(): int32; }",
      "interface Foo { op foo(): int32; op bar(): int32; baz(): int32; }",
    ]);

    parseErrorEach([
      ["interface X {", [/'}' expected/]],
      ["interface X { foo(): string; interface Y", [/'}' expected/]],
      ["interface X { foo(a: string", [/'\)' expected/]],
      ["interface X { foo(@myDec", [/Property expected/]],
      ["interface X { foo(#suppress x", [/Property expected/]],
    ]);
  });

  describe("model expressions", () => {
    parseEach(['model Car { engine: { type: "v8" } }']);
  });

  describe("tuple model expressions", () => {
    parseEach([
      'namespace A { op b(param: [number, string]): [1, "hi"]; }',
      "alias EmptyTuple =  [];",
      "model Template<T=[]> { }",
    ]);
  });

  describe("array expressions", () => {
    parseEach(["model A { foo: B[] }", "model A { foo: B[][] }"]);
  });

  describe("union expressions", () => {
    parseEach(["model A { foo: B | C }", "model A { foo: B | C & D }", "model A { foo: | B | C }"]);
  });

  describe("union declarations", () => {
    parseEach([
      "union A { x: number, y: number } ",
      "@myDec union A { @myDec a: string }",
      "union A<T, V> { a: T; none: {} }",
      `union A { "hi there": string }`,
      `union A { string, int32 }`,
      `union A { B<T>, C<T> }`,
      `union A { "hi", \`bye\` }`,
    ]);
    parseErrorEach([['union A { @myDec "x" x: number, y: string }', [/';' expected/]]]);
  });

  describe("const statements", () => {
    parseEach([
      `const a = 123;`,
      `const a: Info = 123;`,
      `const a: {inline: string} = #{inline: "abc"};`,
      `const a: string | int32 = int32;`,
    ]);
    parseErrorEach([
      [`const = 123;`, [/Identifier expected/]],
      [`const a`, [{ message: "'=' expected." }]],
      [`const a =`, [/Expression expected./]],
    ]);
  });

  describe("call expressions", () => {
    parseEach([
      `const a = int8(123);`,
      `const a = utcDateTime.fromISO("abc");`,
      `const a = utcDateTime.fromISO("abc", "def");`,
    ]);
    parseErrorEach([
      [`const a = int8(123;`, [{ message: "')' expected." }]],
      [`const a = utcDateTime.fromISO(;`, [{ message: "Expression expected." }]],
    ]);
  });

  describe("object literals", () => {
    parseEach([
      `const A = #{a: "abc"};`,
      `const A = #{a: "abc", b: "def"};`,
      `const A = #{a: "abc", ...B};`,
      `const A = #{a: "abc", ...B, c: "ghi"};`,
    ]);
  });

  describe("array literals", () => {
    parseEach([
      `const A = #["abc"];`,
      `const A = #["abc", 123];`,
      `const A = #["abc", 123, #{nested: true}];`,
    ]);
  });

  describe("valueof expressions", () => {
    parseEach([
      "model Foo<T extends valueof string> {}",
      "model Foo<T extends valueof int32> {}",
      "model Foo<T extends valueof {a: string, b: int32}> {}",
      "model Foo<T extends valueof int8[]> {}",
    ]);
  });

  describe("typeof expressions", () => {
    parseEach([`const a: typeof "123" = 123;`, `alias A = Foo<typeof "abc">;`]);
    parseErrorEach([
      [`alias A = typeof #{}`, [{ message: "Typeof expects a value literal or value reference." }]],
    ]);
  });

  describe("template instantiations", () => {
    parseEach(["model A { x: Foo<number, string>; }", "model B { x: Foo<number, string>[]; }"]);
  });

  describe("intersection expressions", () => {
    parseEach(["model A { foo: B & C }", "model A { foo: & B & C }"]);
  });

  describe("parenthesized expressions", () => {
    parseEach(["model A { x: ((B | C) & D)[]; }"]);
  });

  describe("namespace statements", () => {
    parseEach([
      "namespace Store {}",
      "namespace Store { op read(): int32; }",
      "namespace Store { op read(): int32; op write(v: int32): {}; }",
      "namespace Store.Read { op read(): int32; }",
      "@foo namespace Store { @myDec op read(): number; @myDec op write(n: number): {}; }",
      "@foo @bar namespace Store { @foo @bar op read(): number; }",
      "namespace Store { namespace Read { op read(): int32; } namespace Write { op write(v: int32): {}; } }",
      "namespace Store.Read { }",
      "namespace Store;",
      "namespace Store.Read;",
      "@foo namespace Store.Read;",
      "@foo namespace Store.Read { };",
    ]);

    parseErrorEach([
      [
        "namespace Foo { namespace Store; }",
        [{ message: /Blockless namespace can only be top-level/, pos: 16 }],
      ],
      [
        "namespace Store; namespace Store2;",
        [{ message: /Cannot use multiple blockless namespaces/, pos: 17 }],
      ],
      [
        "model Foo { }; namespace Store;",
        [{ message: /Blockless namespaces can't follow other/, pos: 15 }],
      ],
      [
        "namespace Foo { }; namespace Store;",
        [{ message: /Blockless namespaces can't follow other/, pos: 19 }],
      ],
    ]);
  });

  describe("using statements", () => {
    parseEach([
      "using A;",
      "using A.B;",
      "namespace Foo { using A; }",
      // Allow using before blockless namespace
      "using A.B; namespace Foo;",
    ]);
  });

  describe("multiple statements", () => {
    parseEach([
      `
      model A { };
      model B { }
      ;
      namespace I {
        op foo(): number;
      }
      namespace J {

      }


    `,
    ]);
  });

  describe("comments", () => {
    parseEach([
      `
      // Comment
      model A { /* Another comment */
        /*
          and
          another
        */
        property /* 👀 */ : /* 👍 */ int32; // one more
      }
      `,
    ]);
  });

  describe("empty statements", () => {
    parseEach([`;;;;`, `namespace Foo { model Car { }; };`, `model Car { };;;;`]);
  });

  describe("recovery", () => {
    parseErrorEach([
      [`model M { ]`, [/Property expected/]],
      [`model M { /** */ */ prop: string }`, [/Property expected/]],
      [
        `
        @dec1 @dec2 import "foo";
        banana
        model Foo
        `,
        [
          /Cannot decorate import/,
          /Cannot decorate import/,
          /Statement expected/,
          /'{', '=', 'extends', or 'is' expected/,
        ],
      ],
      ["model M {}; This is not a valid statement", [/Statement expected/]],
      ["model M {}; @myDec ;", [/Cannot decorate empty statement/]],
    ]);
  });

  describe("BOM", () => {
    // cspell:disable-next-line
    parseEach(["\u{FEFF}/*<--BOM*/ model M {}"]);
    // cspell:disable-next-line
    parseErrorEach([["model\u{FEFF}/*<--BOM*/ M {}", [/Statement expected/]]]);
  });

  describe("unterminated tokens", () => {
    // cspell:disable-next-line
    parseErrorEach([["/* Yada yada yada", [/Unterminated multi-line comment/]]]);

    const strings = [
      '"banana',
      '"banana\\',
      '"banana\r"',
      '"banana\n"',
      '"banana\r\n"',
      '"""\nbanana',
      '"""\nbanana\\',
    ];
    parseErrorEach(
      Array.from(strings.entries()).map((e) => [
        `alias ${String.fromCharCode(CharCode.A + e[0])} = ${e[1]}`,
        [/Unterminated string literal/],
        (node) => {
          const statement = node.statements[0];
          assert(statement.kind === SyntaxKind.AliasStatement, "alias statement expected");
          const value = statement.value;
          assert(value.kind === SyntaxKind.StringLiteral, "string literal expected");
          assert.strictEqual(value.value, "banana");
        },
      ]),
    );
  });

  describe("terminated tokens at EOF", () => {
    parseErrorEach([
      ["alias X = 0x10101", [/';' expected/]],
      ["alias X = 0xBEEF", [/';' expected/]],
      ["alias X = 123", [/';' expected/]],
      ["alias X = 123e45", [/';' expected/]],
      ["alias X = 123.45", [/';' expected/]],
      ["alias X = 123.45e2", [/';' expected/]],
      ["alias X = Banana", [/';' expected/]],
      ['alias X = "Banana"', [/';' expected/]],
      ['alias X = """\nBanana\n"""', [/';' expected/]],
    ]);
  });

  describe("numeric literals", () => {
    const good: [string, number][] = [
      // Some questions remain here: https://github.com/microsoft/typespec/issues/506
      ["-0", -0],
      ["1e9999", Infinity],
      ["1e-9999", 0],
      ["-1e-9999", -0],
      ["-1e9999", -Infinity],

      // NOTE: No octal in TypeSpec
      ["077", 77],
      ["+077", 77],
      ["-077", -77],

      ["0xABCD", 0xabcd],
      ["0xabcd", 0xabcd],
      ["0x1010", 0x1010],
      ["0b1010", 0b1010],
      ["0", 0],
      ["+0", 0],
      ["0.0", 0.0],
      ["+0.0", 0],
      ["-0.0", -0.0],
      ["123", 123],
      ["+123", 123],
      ["-123", -123],
      ["123.123", 123.123],
      ["+123.123", 123.123],
      ["-123.123", -123.123],
      ["789e42", 789e42],
      ["+789e42", 789e42],
      ["-789e42", -789e42],
      ["654.321e9", 654.321e9],
      ["+654.321e9", 654.321e9],
      ["-654.321e9", -654.321e9],
    ];

    const bad: [string, RegExp][] = [
      ["123.", /Digit expected/],
      ["123.0e", /Digit expected/],
      ["123e", /Digit expected/],
      ["0b", /Binary digit expected/],
      ["0b2", /Binary digit expected/],
      ["0x", /Hexadecimal digit expected/],
      ["0xG", /Hexadecimal digit expected/],
    ];

    parseEach(good.map((c) => [`alias M = ${c[0]};`, (node) => isNumericLiteral(node, c[1])]));
    parseErrorEach(bad.map((c) => [`alias M = ${c[0]};`, [c[1]]]));

    function isNumericLiteral(node: TypeSpecScriptNode, value: number) {
      const statement = node.statements[0];
      assert(statement.kind === SyntaxKind.AliasStatement, "alias statement expected");
      const assignment = statement.value;
      assert(assignment?.kind === SyntaxKind.NumericLiteral, "numeric literal expected");
      assert.strictEqual(assignment.value, value);
    }
  });

  describe("identifiers", () => {
    // cspell:disable
    const good = [
      "short",
      "short42",
      "lowercaseandlong",
      "lowercaseandlong42",
      "camelCase",
      "camelCase42",
      "PascalCase",
      "PascalCase42",
      "has_underscore",
      "has_$dollar",
      "_startsWithUnderscore",
      "$startsWithDollar",
      "Incompréhensible",
      "incompréhensible",
      "IncomprÉhensible",
      "incomprÉhensible",
      // normalization
      ["e\u{0301}toile", "étoile"],
      // leading astral character
      "𐌰𐌲",
      // continuing astral character
      "Banana𐌰𐌲42Banana",
      "banana𐌰𐌲42banana",
      // ZWNJ
      "deaf\u{200c}ly",
      // ZWJ
      "क्‍ष",
      // Leading emoji
      "😁Yay",
      // Continuing emoji
      "Hi✋There",
    ];

    const bad: [string, RegExp][] = [
      ["\u{D800}", /Invalid character/], // unpaired surrogate
      ["\u{E000}", /Invalid character/], // private use
      ["\u{FDD0}", /Invalid character/], // non-character
      ["\u{244B}", /Invalid character/], // unassigned
      ["\u{009F}", /Invalid character/], // control
      ["\u{FFFD}", /Invalid character/], // replacement character
      ["#", /Identifier expected/], // directive
      ["42", /Identifier expected/],
      ["true", /Keyword cannot be used as identifier/],
    ];
    // cspell:enable

    parseEach(
      good.map((entry) => {
        const input = typeof entry === "string" ? entry : entry[0];
        const expected = typeof entry === "string" ? entry : entry[1];

        return [
          `model ${input} {}`,
          (node) => {
            const statement = node.statements[0];
            assert(statement.kind === SyntaxKind.ModelStatement, "Model statement expected.");
            assert.strictEqual(statement.id.sv, expected);
          },
        ];
      }),
    );

    parseErrorEach(bad.map((e) => [`model ${e[0]} {}`, [e[1]]]));
  });

  describe("string template expressions", () => {
    function getNode(astNode: TypeSpecScriptNode): Node {
      const statement = astNode.statements[0];
      strictEqual(statement.kind, SyntaxKind.AliasStatement);
      return statement.value;
    }
    function getStringTemplateNode(astNode: TypeSpecScriptNode): StringTemplateExpressionNode {
      const node = getNode(astNode);
      strictEqual(node.kind, SyntaxKind.StringTemplateExpression);
      return node;
    }

    describe("single line", () => {
      it("parse a single line template expression", () => {
        const astNode = parseSuccessWithLog(`alias T = "Start \${"one"} middle \${23} end";`);
        const node = getStringTemplateNode(astNode);
        strictEqual(node.head.value, "Start ");
        strictEqual(node.spans.length, 2);

        const span0 = node.spans[0];
        strictEqual(span0.literal.value, " middle ");
        strictEqual(span0.expression.kind, SyntaxKind.StringLiteral);
        strictEqual(span0.expression.value, "one");

        const span1 = node.spans[1];
        strictEqual(span1.literal.value, " end");
        strictEqual(span1.expression.kind, SyntaxKind.NumericLiteral);
        strictEqual(span1.expression.value, 23);
      });

      it("parse a single line template with a multi line model expression inside", () => {
        const astNode = parseSuccessWithLog(
          `alias T = "Start \${{ foo: "one",\nbar: "two" }} end";`,
        );
        const node = getStringTemplateNode(astNode);
        strictEqual(node.head.value, "Start ");
        strictEqual(node.spans.length, 1);

        const span0 = node.spans[0];
        strictEqual(span0.literal.value, " end");
        strictEqual(span0.expression.kind, SyntaxKind.ModelExpression);
        strictEqual(span0.expression.properties.length, 2);
      });

      it("can escape some ${}", () => {
        const astNode = parseSuccessWithLog(`alias T = "Start \${"one"} middle \\\${23} end";`);
        const node = getStringTemplateNode(astNode);
        strictEqual(node.head.value, "Start ");
        strictEqual(node.spans.length, 1);

        const span0 = node.spans[0];
        strictEqual(span0.literal.value, " middle ${23} end");
        strictEqual(span0.expression.kind, SyntaxKind.StringLiteral);
        strictEqual(span0.expression.value, "one");
      });

      it("can nest string templates", () => {
        const astNode = parseSuccessWithLog(
          'alias T = "Start ${"nested-start ${"hi"} nested-end"} end";',
        );
        const node = getStringTemplateNode(astNode);
        strictEqual(node.head.value, "Start ");
        strictEqual(node.spans.length, 1);

        const span0 = node.spans[0];
        strictEqual(span0.literal.value, " end");
        strictEqual(span0.expression.kind, SyntaxKind.StringTemplateExpression);
        strictEqual(span0.expression.head.value, "nested-start ");
        strictEqual(span0.expression.spans.length, 1);

        const nestedSpan0 = span0.expression.spans[0];
        strictEqual(nestedSpan0.literal.value, " nested-end");
        strictEqual(nestedSpan0.expression.kind, SyntaxKind.StringLiteral);
        strictEqual(nestedSpan0.expression.value, "hi");
      });

      it("string with all ${} escape is still a StringLiteral", () => {
        const astNode = parseSuccessWithLog(`alias T = "Start \\\${12} middle \\\${23} end";`);
        const node = getNode(astNode);
        strictEqual(node.kind, SyntaxKind.StringLiteral);
        strictEqual(node.value, "Start ${12} middle ${23} end");
      });
    });

    describe("multi line", () => {
      it("parse a multiple line template expression", () => {
        const astNode = parseSuccessWithLog(`alias T = """
      Start \${"one"} 
      middle \${23} 
      end
      """;`);
        const node = getStringTemplateNode(astNode);
        strictEqual(node.head.value, "Start ");
        strictEqual(node.spans.length, 2);

        const span0 = node.spans[0];
        strictEqual(span0.literal.value, " \nmiddle ");
        strictEqual(span0.expression.kind, SyntaxKind.StringLiteral);
        strictEqual(span0.expression.value, "one");

        const span1 = node.spans[1];
        strictEqual(span1.literal.value, " \nend");
        strictEqual(span1.expression.kind, SyntaxKind.NumericLiteral);
        strictEqual(span1.expression.value, 23);
      });

      it("can escape some ${}", () => {
        const astNode = parseSuccessWithLog(`alias T = """
      Start \${"one"} 
      middle \\\${23} 
      end
      """;`);
        const node = getStringTemplateNode(astNode);
        strictEqual(node.head.value, "Start ");
        strictEqual(node.spans.length, 1);

        const span0 = node.spans[0];
        strictEqual(span0.literal.value, " \nmiddle ${23} \nend");
        strictEqual(span0.expression.kind, SyntaxKind.StringLiteral);
        strictEqual(span0.expression.value, "one");
      });

      it("escaping all ${} still produce a string literal", () => {
        const astNode = parseSuccessWithLog(`alias T = """
      Start \\\${12} 
      middle \\\${23} 
      end
      """;`);
        const node = getNode(astNode);
        strictEqual(node.kind, SyntaxKind.StringLiteral);
        strictEqual(node.value, "Start ${12} \nmiddle ${23} \nend");
      });
    });
  });

  // smaller repro of previous regen-samples baseline failures
  describe("sample regressions", () => {
    parseEach([
      [
        `/* \\n <-- before string! */ @pattern("\\\\w") model M {}`,
        (node) => {
          assert(node.statements[0].kind === SyntaxKind.ModelStatement);
          assert(node.statements[0].decorators[0].arguments[0].kind === SyntaxKind.StringLiteral);
          assert.strictEqual(node.statements[0].decorators[0].arguments[0].value, "\\w");
        },
      ],
    ]);
  });

  describe("enum statements", () => {
    parseEach([
      "enum Foo { }",
      "enum Foo { a, b }",
      'enum Foo { a: "hi", c: 10 }',
      "@foo enum Foo { @bar a, @baz b: 10 }",
    ]);

    parseErrorEach([
      ["enum Foo { a: number }", [/Expected numeric or string literal/]],
      ["enum Foo { a: [number] }", [/Expected numeric or string literal/]],
      ["enum Foo { a: ; b: ; }", [/Expression expected/, /Expression expected/]],
      ["enum Foo { ;+", [/Enum member expected/]],
      ["enum { }", [/Identifier expected/]],
    ]);
  });

  describe("alias statements", () => {
    parseEach(["alias X = 1;", "alias X = A | B;", "alias MaybeUndefined<T> = T | undefined;"]);
    parseErrorEach([
      ["@foo alias Bar = 1;", [/Cannot decorate alias statement/]],
      ["alias Foo =", [/Expression expected/]],
      ["alias Foo<> =", [/Identifier expected/, /Expression expected/]],
      ["alias Foo<T> = X |", [/Expression expected/]],
      ["alias =", [/Identifier expected/]],
    ]);
  });

  describe("directives", () => {
    describe("emit single diagnostic when the parameters are not expected types", () => {
      parseErrorEach(
        [
          ["#suppress foo;\nmodel Foo {}", [/Unexpected token Semicolon/]],
          ["#suppress foo 123\nmodel Foo {}", [/Unexpected token NumericLiteral/]],
          ["#deprecated 321\nop doFoo(): string;", [/Unexpected token NumericLiteral/]],
        ],
        { strict: true },
      );
    });

    describe("ensure directives and decorators are applied to leaf node", () => {
      parseEach([
        [
          `@doc("foo")\n#suppress "foo"\nnamespace Foo.Bar {}`,
          (node) => {
            const fooNs = node.statements[0];
            strictEqual(fooNs.kind, SyntaxKind.NamespaceStatement);
            const barNs = (fooNs as any).statements;
            strictEqual(barNs.kind, SyntaxKind.NamespaceStatement);
            strictEqual(fooNs.id.sv, "Foo");
            strictEqual(barNs.id.sv, "Bar");
            strictEqual(fooNs.directives?.length, 0);
            strictEqual(fooNs.decorators.length, 0);
            strictEqual(barNs.directives?.length, 1);
            strictEqual(barNs.decorators.length, 1);
          },
        ],
      ]);
    });
  });

  describe("augment decorator statements", () => {
    parseEach(["@@tag(Foo);", `@@doc(Foo, "x");`, `@@doc(Foo.prop1, "x");`]);

    parseErrorEach([
      [
        "@@tag",
        [
          {
            code: "augment-decorator-target",
            message: "Augment decorator first argument must be a type reference.",
            pos: 5,
          },
        ],
      ],
    ]);
  });

  describe("decorator declarations", () => {
    parseEach([
      "dec myDec(target: Type);",
      "extern dec myDec(target: Type);",
      "namespace Lib { extern dec myDec(target: Type);}",
      "extern dec myDec(target: Type, arg1: StringLiteral);",
      "extern dec myDec(target: Type, optional?: StringLiteral);",
      "extern dec myDec(target: Type, ...rest: StringLiteral[]);",
      "extern dec myDec(target, arg1, ...rest);",
    ]);

    parseErrorEach([
      ["dec myDec(target: Type)", [{ code: "token-expected", message: "';' expected." }]],
      [
        "dec myDec();",
        [{ code: "decorator-decl-target", message: "dec must have at least one parameter." }],
      ],
      [
        "dec myDec(target: Type, optionalFirst?: StringLiteral, requiredAfter: StringLiteral);",
        [
          {
            code: "required-parameter-first",
            message: "A required parameter cannot follow an optional parameter.",
          },
        ],
      ],
      [
        "dec myDec(target: Type, ...optionalRest?: StringLiteral[]);",
        [
          {
            code: "rest-parameter-required",
            message: "A rest parameter cannot be optional.",
          },
        ],
      ],
      [
        "dec myDec(target: Type, ...restFirst: StringLiteral[], paramAfter: StringLiteral);",
        [
          {
            code: "rest-parameter-last",
            message: "A rest parameter must be last in a parameter list.",
          },
        ],
      ],
    ]);
  });

  describe("function declarations", () => {
    parseEach([
      "fn myDec(): void;",
      "extern fn myDec(): StringLiteral;",
      "namespace Lib { extern fn myDec(): StringLiteral;}",
      "extern fn myDec(arg1: StringLiteral): void;",
      "extern fn myDec(optional?: StringLiteral): void;",
      "extern fn myDec(...rest: StringLiteral[]): void;",
      "extern fn myDec(arg1, ...rest): void;",
    ]);

    parseErrorEach([
      ["fn myDec(target: Type): void", [{ code: "token-expected", message: "';' expected." }]],
      [
        "fn myDec(target: Type, optionalFirst?: StringLiteral, requiredAfter: StringLiteral): void;",
        [
          {
            code: "required-parameter-first",
            message: "A required parameter cannot follow an optional parameter.",
          },
        ],
      ],
      [
        "fn myDec(target: Type, ...optionalRest?: StringLiteral[]): void;",
        [
          {
            code: "rest-parameter-required",
            message: "A rest parameter cannot be optional.",
          },
        ],
      ],
      [
        "fn myDec(target: Type, ...restFirst: StringLiteral[], paramAfter: StringLiteral): void;",
        [
          {
            code: "rest-parameter-last",
            message: "A rest parameter must be last in a parameter list.",
          },
        ],
      ],
    ]);
  });

  describe("projections", () => {
    describe("selectors", () => {
      const selectors = ["model", "op", "interface", "union", "scalar", "someId"];
      const codes = selectors.map((s) => `projection ${s}#tag { }`);
      parseEach(codes);
    });

    describe("direction", () => {
      parseEach([`projection model#tag { to { } }`, `projection model #tag { from { } }`]);
    });

    describe("projection parameters", () => {
      parseEach([
        `projection model#v { to(version) { } }`,
        `projection model#foo{ from(bar, baz) { } }`,
        `projection model#v { pre to(version) { } }`,
        `projection model#foo{ pre from(bar, baz) { } }`,
      ]);
    });
    describe("projection expressions", () => {
      const exprs = [
        `x || y`,
        `x > 10 || y < 20`,
        `x || y || z`,
        `x && y`,
        `x > 10 && y < 20`,
        `x && y && z`,
        `x && y || z && q`,
        `x || y && z || q`,
        `x * y`,
        `x + y`,
        `x / y`,
        `x - y`,
        `x + y * z / a + b - c`,
        `x <= y`,
        `x >= y`,
        `x > y`,
        `x < y`,
        `!x`,
        `x()`,
        `x(a, b, c)`,
        `x.y`,
        `x().y`,
        `x().y()`,
        `x()()`,
        `x()(T)`,
        `x(T)()`,
        `x(T).y()(T)`,
        `self`,
        `if x { }`,
        `if x { a; b; } else { c; }`,
        `if x > 1 { }`,
        `if if x > 1 { a; } else { b; } { c; } else { d; }`,
        `(x) => { x + 1; }`,
        `(x) => { if x { x; } else { y; }; }`,
        `1`,
        `"string"`,
        `{ x: 1 }`,
        `{ x: if 1 { Foo; } else { Bar; } }`,
        `[a, b]`,
        `[]`,
        `(a)`,
        `(a + 1)`,
      ];
      const codes = exprs.map((exp) => `projection foo#tag { to { ${exp}; } }`);
      parseEach(codes);
    });

    describe("recovery", () => {
      parseErrorEach([
        [
          `projection `,
          [/identifier, 'model', 'op', 'interface', 'union', 'enum', or 'scalar' expected./],
        ],
        [`projection x `, [/'#' expected/]],
        [`projection x#`, [/Identifier expected/]],
        [`projection x#f`, [/'{' expected/]],
        [`projection x#f {`, [/'}' expected/]],
        [`projection x#f { asdf`, [/from or to expected/]],
        [`projection x#f { pre asdf`, [/from or to expected/]],
        [`projection x#f { to (`, [/'\)' expected/]],
        [`projection x#f { to @`, [/'{' expected/]],
        [`projection x#f { to {`, [/} expected/]],
        [`projection x#f { to {}`, [/'}' expected/]],
        [`projection x#f { pre to (`, [/'\)' expected/]],
        [`projection x#f { pre to @`, [/'{' expected/]],
        [`projection x#f { pre to {`, [/} expected/]],
        [`projection x#f { pre to {}`, [/'}' expected/]],
      ]);
    });
  });

  describe("invalid statement", () => {
    parseErrorEach([["@myDecN.)", [/Identifier expected/]]]);
  });

  describe("doc comments", () => {
    parseEach(
      [
        [
          `
          /** One-liner */
          model M {}
          `,
          (script) => {
            const docs = script.statements[0].docs;
            strictEqual(docs?.length, 1);
            strictEqual(docs[0].content.length, 1);
            strictEqual(docs[0].content[0].text, "One-liner");
            strictEqual(docs[0].tags.length, 0);
          },
        ],
        [
          `
          /** Escape at the end \\*/
          model M {}
          `,
          (script) => {
            const docs = script.statements[0].docs;
            strictEqual(docs?.length, 1);
            strictEqual(docs[0].content.length, 1);
            strictEqual(docs[0].content[0].text, "Escape at the end \\");
            strictEqual(docs[0].tags.length, 0);
          },
        ],
        [
          `
          /**
           * This one has a \`code span\` and a code fence and it spreads over
           * more than one line.
           *
           * \`\`\`
           * This is not a @tag because we're in a code fence.
           *   This is indented code.
           * \`\`\`
           *
           *\`\`\`
           *This code fence is glued
           *to the stars
           *\`\`\`
           *
           * \`This is not a @tag either because we're in a code span\`.
           *
           * This is not a \\@tag because it is escaped.
           *
           * @param x the param
           * that continues on another line
           * @param y - another param
           * @template T some template
           * @template U - another template
           * @returns something
           * @pretend this an unknown tag
           */
          op test<T, U>(x: string, y: string): string;
          `,
          (script) => {
            const docs = script.statements[0].docs;
            strictEqual(docs?.length, 1);
            strictEqual(docs[0].content.length, 1);

            strictEqual(
              docs[0].content[0].text,
              "This one has a `code span` and a code fence and it spreads over\n" +
                "more than one line.\n\n" +
                "```\n" +
                "This is not a @tag because we're in a code fence.\n" +
                "  This is indented code.\n" +
                "```\n\n" +
                "```\n" +
                "This code fence is glued\n" +
                "to the stars\n" +
                "```\n\n" +
                "`This is not a @tag either because we're in a code span`.\n" +
                "\n" +
                "This is not a @tag because it is escaped.",
            );
            strictEqual(docs[0].tags.length, 6);
            const [xParam, yParam, tTemplate, uTemplate, returns, pretend] = docs[0].tags;

            strictEqual(xParam.kind, SyntaxKind.DocParamTag as const);
            strictEqual(xParam.tagName.sv, "param");
            strictEqual(xParam.paramName.sv, "x");
            strictEqual(xParam.content[0].text, "the param\nthat continues on another line");

            // `y` has hyphen in doc string, which should be dropped
            strictEqual(yParam.kind, SyntaxKind.DocParamTag as const);
            strictEqual(yParam.tagName.sv, "param");
            strictEqual(yParam.paramName.sv, "y");
            strictEqual(yParam.content[0].text, "another param");

            strictEqual(tTemplate.kind, SyntaxKind.DocTemplateTag as const);
            strictEqual(tTemplate.tagName.sv, "template");
            strictEqual(tTemplate.paramName.sv, "T");
            strictEqual(tTemplate.content[0].text, "some template");

            // `U` has hyphen in doc string, which should be dropped
            strictEqual(uTemplate.kind, SyntaxKind.DocTemplateTag as const);
            strictEqual(uTemplate.tagName.sv, "template");
            strictEqual(uTemplate.paramName.sv, "U");
            strictEqual(uTemplate.content[0].text, "another template");

            strictEqual(returns.kind, SyntaxKind.DocReturnsTag as const);
            strictEqual(returns.tagName.sv, "returns");
            strictEqual(returns.content[0].text, "something");

            strictEqual(pretend.kind, SyntaxKind.DocUnknownTag as const);
            strictEqual(pretend.tagName.sv, "pretend");
            strictEqual(pretend.content[0].text, "this an unknown tag");
          },
        ],
        [
          `
          /**
           * Lines that end with \\
           * don't create an extra star.
           */
          model M {}
          `,
          (script) => {
            const docs = script.statements[0].docs;
            strictEqual(docs?.length, 1);
            strictEqual(docs[0].content.length, 1);
            strictEqual(
              docs[0].content[0].text,
              "Lines that end with \\\ndon't create an extra star.",
            );
          },
        ],
      ],
      { docs: true },
    );

    describe("relation with comments", () => {
      it("mark used block comment with parsedAsDocs", () => {
        const script = parse(
          `
        /** One-liner */
        model M {}
      `,
          { docs: true, comments: true },
        );
        const comments = script.comments;
        strictEqual(comments[0].kind, SyntaxKind.BlockComment);
        strictEqual(comments[0].parsedAsDocs, true);
      });

      it("other comments are not marked with parsedAsDocs", () => {
        const script = parse(
          `
        /* One-liner */
        model M {}
      `,
          { docs: true, comments: true },
        );
        const comments = script.comments;
        strictEqual(comments[0].kind, SyntaxKind.BlockComment);
        ok(!comments[0].parsedAsDocs);
      });

      it("doc comment syntax not attached to any node are not marked with parsedAsDocs", () => {
        const script = parse(
          `
        /** One-liner */
      `,
          { docs: true, comments: true },
        );
        const comments = script.comments;
        strictEqual(comments[0].kind, SyntaxKind.BlockComment);
        ok(!comments[0].parsedAsDocs);
      });
    });

    parseErrorEach(
      [
        [
          "/** @42 */ model M {}",
          [
            {
              code: "doc-invalid-identifier",
              message: /tag/,
              severity: "warning",
            },
          ],
        ],
        [
          "/** @ */ model M {}",
          [
            {
              code: "doc-invalid-identifier",
              message: /tag/,
              severity: "warning",
            },
          ],
        ],
        [
          "/** @template 42 */ model M {}",
          [
            {
              code: "doc-invalid-identifier",
              message: /template parameter/,
              severity: "warning",
            },
          ],
        ],
        [
          "/** @template */ model M {}",
          [
            {
              code: "doc-invalid-identifier",
              message: /template parameter/,
              severity: "warning",
            },
          ],
        ],
        [
          "/** @param 42 */ model M {}",
          [
            {
              code: "doc-invalid-identifier",
              message: / (?<!template )parameter/,
              severity: "warning",
            },
          ],
        ],
        [
          "/** @param */ model M {}",
          [
            {
              code: "doc-invalid-identifier",
              message: / (?<!template )parameter/,
              severity: "warning",
            },
          ],
        ],
      ],
      {
        docs: true,
        strict: true,
      },
    );
  });

  describe("annotations order", () => {
    function expectHasDocComment(script: TypeSpecScriptNode, content: string, index: number = 0) {
      const docs = script.statements[0].docs;
      strictEqual(docs?.[index].content[0].text, content);
    }

    function expectHasDirective(script: TypeSpecScriptNode, id: string) {
      const directives = script.statements[0].directives;
      ok(
        directives?.some((x) => x.target.sv === id),
        `Should have found a directive with id ${id} but only has ${directives?.map(
          (x) => x.target.sv,
        )}`,
      );
    }

    function expectHasDecorator(script: TypeSpecScriptNode, id: string) {
      const decorators = (script.statements[0] as DecorableNode).decorators;
      ok(
        decorators?.some((x) => (x.target as IdentifierNode).sv === id),
        `Should have found a directive with id ${id} but only has ${decorators?.map(
          (x) => (x.target as IdentifierNode).sv,
        )}`,
      );
    }

    parseEach([
      [
        `
        /** doc, directive, decorator */
        #suppress "a" "a"
        @foo
        model M {}
        `,
        (script) => {
          expectHasDocComment(script, "doc, directive, decorator");
          expectHasDirective(script, "suppress");
          expectHasDecorator(script, "foo");
        },
      ],

      [
        `
        #suppress "a" "a"
        /** directive, doc, decorator */
        @foo
        model M {}
        `,
        (script) => {
          expectHasDocComment(script, "directive, doc, decorator");
          expectHasDirective(script, "suppress");
          expectHasDecorator(script, "foo");
        },
      ],

      [
        `
        #suppress "a" "a"
        @foo
        /** directive, decorator, doc */
        model M {}
        `,
        (script) => {
          expectHasDocComment(script, "directive, decorator, doc");
          expectHasDirective(script, "suppress");
          expectHasDecorator(script, "foo");
        },
      ],

      [
        `
        /** doc, decorator, directive */
        @foo
        #suppress "a" "a"
        model M {}
        `,
        (script) => {
          expectHasDocComment(script, "doc, decorator, directive");
          expectHasDirective(script, "suppress");
          expectHasDecorator(script, "foo");
        },
      ],
      [
        `
        @foo
        /** decorator, doc, directive */
        #suppress "a" "a"
        model M {}
        `,
        (script) => {
          expectHasDocComment(script, "decorator, doc, directive");
          expectHasDirective(script, "suppress");
          expectHasDecorator(script, "foo");
        },
      ],
      [
        `
        @foo
        #suppress "a" "a"
        /** decorator, directive, doc */
        model M {}
        `,
        (script) => {
          expectHasDocComment(script, "decorator, directive, doc");
          expectHasDirective(script, "suppress");
          expectHasDecorator(script, "foo");
        },
      ],
      [
        `
        /** first: doc, directive, doc, decorator, doc */
        #suppress "a" "a"
        /** second */
        @foo
        /** third */
        model M {}
        `,
        (script) => {
          expectHasDocComment(script, "first: doc, directive, doc, decorator, doc", 0);
          expectHasDocComment(script, "second", 1);
          expectHasDocComment(script, "third", 2);
          expectHasDirective(script, "suppress");
          expectHasDecorator(script, "foo");
        },
      ],
    ]);
  });
  describe("conflict marker", () => {
    // NOTE: Use of ${} to obfuscate conflict markers so that they're not
    // flagged while working on these tests.
    parseErrorEach(
      [
        [
          `
${"<<<<<<<"} ours
model XY {}
${"|||||||"} base
model X {}
${"======="}
model XYZ {}
${">>>>>>>"} theirs`,
          [
            { code: "conflict-marker", pos: 1, end: 8 },
            { code: "conflict-marker", pos: 26, end: 33 },
            { code: "conflict-marker", pos: 50, end: 57 },
            { code: "conflict-marker", pos: 71, end: 78 },
          ],
        ],
        [
          `
${"<<<<<<<"} ours
model XY {}
${"======="}
model XYZ {}
${">>>>>>>"} theirs`,
          [
            { code: "conflict-marker", pos: 1, end: 8 },
            { code: "conflict-marker", pos: 26, end: 33 },
            { code: "conflict-marker", pos: 47, end: 54 },
          ],
        ],
      ],
      { strict: true },
    );
  });
});

type Callback = (node: TypeSpecScriptNode) => void;

function parseEach(cases: (string | [string, Callback])[], options?: ParseOptions) {
  for (const each of cases) {
    const code = typeof each === "string" ? each : each[0];
    const callback = typeof each === "string" ? undefined : each[1];
    it("parses `" + shorten(code) + "`", () => {
      logVerboseTestOutput("=== Source ===");
      logVerboseTestOutput(code);

      logVerboseTestOutput("\n=== Parse Result ===");
      const astNode = parse(code, options);
      if (callback) {
        callback(astNode);
      }
      dumpAST(astNode);

      logVerboseTestOutput("\n=== Diagnostics ===");
      if (astNode.parseDiagnostics.length > 0) {
        const diagnostics = astNode.parseDiagnostics.map(formatDiagnostic).join("\n");
        assert.strictEqual(
          hasParseError(astNode),
          astNode.parseDiagnostics.some((e) => e.severity === "error"),
          "root node claims to have no parse errors, but these were reported:\n" +
            diagnostics +
            "\n(If you've added new AST nodes or properties, make sure you implemented the new visitors)",
        );

        assert.fail("Unexpected parse errors in test:\n" + diagnostics);
      }

      assert(astNode.printable, "Parse tree with no errors should be printable");

      checkInvariants(astNode);
    });
  }
}

function checkInvariants(astNode: TypeSpecScriptNode) {
  checkVisitChildren(astNode, astNode.file);
  checkPositioning(astNode, astNode.file);
}

function dynamicVisitChildren(node: Node, cb: (key: string, child: any) => void) {
  for (const [key, value] of Object.entries(node)) {
    switch (key) {
      case "parent":
      case "signature": // OperationStatementNode.signature doesn't have a node type
      case "parseDiagnostics":
        return;
    }
    if (Array.isArray(value)) {
      for (const each of value) {
        cb(key, each);
      }
    } else if (typeof value === "object" && "kind" in value) {
      cb(key, value);
    }
  }
}

function checkVisitChildren(node: Node, file: SourceFile) {
  const visited = new Map<Node, string>();

  dynamicVisitChildren(node, (key, child) => visited.set(child, key));
  visitChildren(node, (child) => void visited.delete(child));

  deepStrictEqual(
    Array.from(visited.values()),
    [],
    `Nodes not visited by visitChildren of ${SyntaxKind[node.kind]}`,
  );

  visitChildren(node, (child) => checkVisitChildren(child, file));
}

function checkPositioning(node: Node, file: SourceFile) {
  visitChildren(node, (child) => {
    if (child.pos < node.pos || child.end > node.end) {
      logVerboseTestOutput("Parent: ");
      dumpAST(node, file);
      logVerboseTestOutput("Child: ");
      dumpAST(child, file);
      assert.fail("child node positioned outside parent node");
    }
    checkPositioning(child, file);
  });
}

/**
 * Parse the given code and log debug information.
 */
function parseWithLog(code: string, options?: ParseOptions): TypeSpecScriptNode {
  logVerboseTestOutput("=== Source ===");
  logVerboseTestOutput(code);

  const astNode = parse(code, options);
  logVerboseTestOutput("\n=== Parse Result ===");
  dumpAST(astNode);
  return astNode;
}
/**
 * Check the given code parse successfully and log debug information.
 */
function parseSuccessWithLog(code: string, options?: ParseOptions): TypeSpecScriptNode {
  const astNode = parseWithLog(code, options);
  logVerboseTestOutput("\n=== Diagnostics ===");
  logVerboseTestOutput((log) => {
    for (const each of astNode.parseDiagnostics) {
      log(formatDiagnostic(each));
    }
  });
  expectDiagnosticEmpty(astNode.parseDiagnostics);
  return astNode;
}

/**
 *
 * @param cases Test cases
 * @param options {
 *   strict: Make sure there is exactly the same amount of diagnostics reported as the number of matches.
 * }
 */
function parseErrorEach(
  cases: [string, (RegExp | DiagnosticMatch)[], Callback?][],
  options: ParseOptions & { strict: boolean } = { strict: false },
) {
  for (const [code, matches, callback] of cases) {
    it(`doesn't parse '${shorten(code)}'`, () => {
      const astNode = parseWithLog(code, options);
      if (callback) {
        callback(astNode);
      }
      logVerboseTestOutput("\n=== Diagnostics ===");
      logVerboseTestOutput((log) => {
        for (const each of astNode.parseDiagnostics) {
          log(formatDiagnostic(each));
        }
      });
      assert.notStrictEqual(astNode.parseDiagnostics.length, 0, "no diagnostics reported");
      if (options.strict) {
        assert.strictEqual(
          astNode.parseDiagnostics.length,
          matches.length,
          "More diagnostics reported than expected.",
        );
      }

      const expected = matches.map<DiagnosticMatch>((m) =>
        m instanceof RegExp ? { message: m } : m,
      );
      expectDiagnostics(astNode.parseDiagnostics, expected, options);

      if (astNode.parseDiagnostics.some((e) => e.severity !== "warning")) {
        assert(
          hasParseError(astNode),
          "node claims to have no parse errors, but above were reported.",
        );

        assert(
          !astNode.printable ||
            !astNode.parseDiagnostics.some((d) => !/^'[,;:{}()]' expected\.$/.test(d.message)),
          "parse tree with errors other than missing punctuation should not be printable",
        );
      }

      checkInvariants(astNode);
    });
  }
}

function shorten(code: string) {
  return code.replace(/\s+/g, " ");
}
