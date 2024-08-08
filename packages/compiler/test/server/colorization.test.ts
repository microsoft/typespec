import { deepStrictEqual, ok } from "assert";
import { readFile } from "fs/promises";
import { createRequire } from "module";
import { dirname, resolve } from "path";
import { describe, it } from "vitest";
import vscode_oniguruma from "vscode-oniguruma";
import vscode_textmate, { IOnigLib, StateStack } from "vscode-textmate";
import { createSourceFile } from "../../src/core/source-file.js";
import { TypeSpecScope } from "../../src/server/tmlanguage.js";
import { SemanticToken, SemanticTokenKind } from "../../src/server/types.js";
import { createTestServerHost } from "../../src/testing/test-server-host.js";
import { findTestPackageRoot } from "../../src/testing/test-utils.js";
import { deepEquals } from "../../src/utils/index.js";

const { parseRawGrammar, Registry } = vscode_textmate;
const { createOnigScanner, createOnigString, loadWASM } = vscode_oniguruma;

export type MetaScope = `meta.${string}.tsp`;
export type TokenScope = TypeSpecScope | MetaScope;

interface Token {
  text: string;
  scope: TokenScope;
}

function createToken(text: string, scope: TokenScope): Token {
  return { text, scope };
}

type Tokenize = (input: string) => Promise<Token[]>;

const Token = {
  keywords: {
    model: createToken("model", "keyword.other.tsp"),
    scalar: createToken("scalar", "keyword.other.tsp"),
    init: createToken("init", "keyword.other.tsp"),
    enum: createToken("enum", "keyword.other.tsp"),
    union: createToken("union", "keyword.other.tsp"),
    operation: createToken("op", "keyword.other.tsp"),
    namespace: createToken("namespace", "keyword.other.tsp"),
    interface: createToken("interface", "keyword.other.tsp"),
    alias: createToken("alias", "keyword.other.tsp"),
    dec: createToken("dec", "keyword.other.tsp"),
    fn: createToken("fn", "keyword.other.tsp"),
    projection: createToken("projection", "keyword.other.tsp"),
    extends: createToken("extends", "keyword.other.tsp"),
    extern: createToken("extern", "keyword.other.tsp"),
    is: createToken("is", "keyword.other.tsp"),
    if: createToken("if", "keyword.other.tsp"),
    else: createToken("else", "keyword.other.tsp"),
    to: createToken("to", "keyword.other.tsp"),
    from: createToken("from", "keyword.other.tsp"),
    valueof: createToken("valueof", "keyword.other.tsp"),
    typeof: createToken("typeof", "keyword.other.tsp"),
    const: createToken("const", "keyword.other.tsp"),
    using: createToken("using", "keyword.other.tsp"),
    other: (text: string) => createToken(text, "keyword.other.tsp"),
  },

  meta: (text: string, meta: string) => createToken(text, `meta.${meta}.tsp`),

  identifiers: {
    variable: (name: string) => createToken(name, "variable.name.tsp"),
    functionName: (name: string) => createToken(name, "entity.name.function.tsp"),
    tag: (name: string) => createToken(name, "entity.name.tag.tsp"),
    type: (name: string) => createToken(name, "entity.name.type.tsp"),
  },

  tspdoc: {
    tag: (name: string) => createToken(name, "keyword.tag.tspdoc"),
  },

  operators: {
    assignment: createToken("=", "keyword.operator.assignment.tsp"),
    optional: createToken("?", "keyword.operator.optional.tsp"),
    typeAnnotation: createToken(":", "keyword.operator.type.annotation.tsp"),
    selector: createToken("#", "keyword.operator.selector.tsp"),
    spread: createToken("...", "keyword.operator.spread.tsp"),
  },

  punctuation: {
    comma: createToken(",", "punctuation.comma.tsp"),
    accessor: createToken(".", "punctuation.accessor.tsp"),
    valueAccessor: createToken("::", "punctuation.accessor.tsp"),
    openBracket: createToken("[", "punctuation.squarebracket.open.tsp"),
    closeBracket: createToken("]", "punctuation.squarebracket.close.tsp"),
    openBrace: createToken("{", "punctuation.curlybrace.open.tsp"),
    closeBrace: createToken("}", "punctuation.curlybrace.close.tsp"),
    openParen: createToken("(", "punctuation.parenthesis.open.tsp"),
    closeParen: createToken(")", "punctuation.parenthesis.close.tsp"),
    openHashBrace: createToken("#{", "punctuation.hashcurlybrace.open.tsp"),
    openHashBracket: createToken("#[", "punctuation.hashsquarebracket.open.tsp"),
    semicolon: createToken(";", "punctuation.terminator.statement.tsp"),

    typeParameters: {
      begin: createToken("<", "punctuation.definition.typeparameters.begin.tsp"),
      end: createToken(">", "punctuation.definition.typeparameters.end.tsp"),
    },
    templateExpression: {
      begin: createToken("${", "punctuation.definition.template-expression.begin.tsp"),
      end: createToken("}", "punctuation.definition.template-expression.end.tsp"),
    },
  },

  literals: {
    escape: (char: string) => createToken(`\\${char}`, "constant.character.escape.tsp"),
    numeric: (text: string) => createToken(text, "constant.numeric.tsp"),
    stringQuoted: (text: string) => createToken('"' + text + '"', "string.quoted.double.tsp"),
    string: (text: string) => createToken(text, "string.quoted.double.tsp"),
    stringTriple: (text: string) => createToken(text, "string.quoted.triple.tsp"),
  },
  comment: {
    block: (text: string) => createToken(text, "comment.block.tsp"),
    line: (text: string) => createToken(text, "comment.line.double-slash.tsp"),
  },
} as const;

testColorization("semantic colorization", tokenizeSemantic);
testColorization("tmlanguage", tokenizeTMLanguage);

function testColorization(description: string, tokenize: Tokenize) {
  function joinTokensInSemantic<T extends Token>(tokens: T[], separator: "" | "\n" = ""): T[] {
    if (tokenize === tokenizeSemantic) {
      return [createToken(tokens.map((x) => x.text).join(separator), tokens[0].scope)] as any;
    }
    return tokens;
  }

  describe(`compiler: server: ${description}`, () => {
    describe("strings", () => {
      function templateTripleOrDouble(text: string): Token {
        return tokenize === tokenizeSemantic
          ? Token.literals.string(text)
          : Token.literals.stringTriple(text);
      }

      describe("single line", () => {
        it("tokenize template", async () => {
          const tokens = await tokenize(`"Start \${123} end"`);
          deepStrictEqual(tokens, [
            ...joinTokensInSemantic([Token.literals.string('"'), Token.literals.string("Start ")]),
            Token.punctuation.templateExpression.begin,
            Token.literals.numeric("123"),
            Token.punctuation.templateExpression.end,
            ...joinTokensInSemantic([Token.literals.string(" end"), Token.literals.string('"')]),
          ]);
        });

        it("tokenize template with multiple interpolation", async () => {
          const tokens = await tokenize(`"Start \${123} middle \${456} end"`);
          deepStrictEqual(tokens, [
            ...joinTokensInSemantic([Token.literals.string('"'), Token.literals.string("Start ")]),
            Token.punctuation.templateExpression.begin,
            Token.literals.numeric("123"),
            Token.punctuation.templateExpression.end,
            Token.literals.string(" middle "),
            Token.punctuation.templateExpression.begin,
            Token.literals.numeric("456"),
            Token.punctuation.templateExpression.end,
            ...joinTokensInSemantic([Token.literals.string(" end"), Token.literals.string('"')]),
          ]);
        });

        it("tokenize as a string if the template expression are escaped", async () => {
          const tokens = await tokenize(`"Start \\\${123} end"`);
          deepStrictEqual(tokens, [
            ...joinTokensInSemantic([
              Token.literals.string('"'),
              Token.literals.string("Start "),
              Token.literals.escape("$"),
              Token.literals.string("{123} end"),
              Token.literals.string('"'),
            ]),
          ]);
        });

        it("tokenize as a string if it is a simple string", async () => {
          const tokens = await tokenize(`"Start end"`);
          deepStrictEqual(tokens, [Token.literals.stringQuoted("Start end")]);
        });
      });

      describe("multi line", () => {
        it("tokenize template", async () => {
          const tokens = await tokenize(`"""
          Start \${123} 
          end
          """`);
          deepStrictEqual(tokens, [
            ...joinTokensInSemantic(
              [Token.literals.stringTriple('"""'), Token.literals.stringTriple("          Start ")],
              "\n"
            ),
            Token.punctuation.templateExpression.begin,
            Token.literals.numeric("123"),
            Token.punctuation.templateExpression.end,
            ...joinTokensInSemantic(
              [
                templateTripleOrDouble(" "),
                templateTripleOrDouble("          end"),
                ...joinTokensInSemantic([
                  templateTripleOrDouble("          "),
                  templateTripleOrDouble('"""'),
                ]),
              ],
              "\n"
            ),
          ]);
        });

        it("tokenize as a string if the template expression are escaped", async () => {
          const tokens = await tokenize(`"""
          Start \\\${123} 
          end
          """`);
          deepStrictEqual(tokens, [
            ...joinTokensInSemantic(
              [
                Token.literals.stringTriple('"""'),
                ...joinTokensInSemantic([
                  Token.literals.stringTriple("          Start "),
                  Token.literals.escape("$"),
                  Token.literals.stringTriple("{123} "),
                ]),
                Token.literals.stringTriple("          end"),
                ...joinTokensInSemantic([
                  Token.literals.stringTriple("          "),
                  Token.literals.stringTriple('"""'),
                ]),
              ],
              "\n"
            ),
          ]);
        });

        it("tokenize as a simple string", async () => {
          const tokens = await tokenize(`"""
          Start
          end
          """`);
          deepStrictEqual(tokens, [
            ...joinTokensInSemantic(
              [
                Token.literals.stringTriple(`"""`),
                Token.literals.stringTriple("          Start"),
                Token.literals.stringTriple("          end"),
                ...joinTokensInSemantic([
                  Token.literals.stringTriple("          "),
                  Token.literals.stringTriple(`"""`),
                ]),
              ],
              "\n"
            ),
          ]);
        });
      });
    });

    describe("using", () => {
      it("single namespace", async () => {
        const tokens = await tokenize("using foo;");
        deepStrictEqual(tokens, [
          Token.keywords.using,
          Token.identifiers.type("foo"),
          Token.punctuation.semicolon,
        ]);
      });

      it("nested namespace", async () => {
        const tokens = await tokenize("using foo.bar;");
        deepStrictEqual(tokens, [
          Token.keywords.using,
          Token.identifiers.type("foo"),
          Token.punctuation.accessor,
          Token.identifiers.type("bar"),
          Token.punctuation.semicolon,
        ]);
      });
    });

    describe("aliases", () => {
      it("simple alias", async () => {
        const tokens = await tokenize("alias Foo = string");
        deepStrictEqual(tokens, [
          Token.keywords.alias,
          Token.identifiers.type("Foo"),
          Token.operators.assignment,
          Token.identifiers.type("string"),
        ]);
      });

      it("templated alias", async () => {
        const tokens = await tokenize("alias Foo<T> = T");
        deepStrictEqual(tokens, [
          Token.keywords.alias,
          Token.identifiers.type("Foo"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("T"),
          Token.punctuation.typeParameters.end,
          Token.operators.assignment,
          Token.identifiers.type("T"),
        ]);
      });

      it("templated alias with default", async () => {
        const tokens = await tokenize("alias Foo<T = string> = T");
        deepStrictEqual(tokens, [
          Token.keywords.alias,
          Token.identifiers.type("Foo"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("T"),
          Token.operators.assignment,
          Token.identifiers.type("string"),
          Token.punctuation.typeParameters.end,
          Token.operators.assignment,
          Token.identifiers.type("T"),
        ]);
      });
      it("templated alias with constraint", async () => {
        const tokens = await tokenize("alias Foo<T extends string> = T");
        deepStrictEqual(tokens, [
          Token.keywords.alias,
          Token.identifiers.type("Foo"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("T"),
          Token.keywords.extends,
          Token.identifiers.type("string"),
          Token.punctuation.typeParameters.end,
          Token.operators.assignment,
          Token.identifiers.type("T"),
        ]);
      });
    });

    describe("valueof", () => {
      it("simple valueof", async () => {
        const tokens = await tokenize("model Foo<T extends valueof string> {}");
        deepStrictEqual(tokens, [
          Token.keywords.model,
          Token.identifiers.type("Foo"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("T"),
          Token.keywords.extends,
          Token.keywords.valueof,
          Token.identifiers.type("string"),
          Token.punctuation.typeParameters.end,
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });
    });

    describe("typeof", () => {
      it("simple typeof", async () => {
        const tokens = await tokenize(`alias B = Foo<typeof "abc">;`);
        deepStrictEqual(tokens, [
          Token.keywords.alias,
          Token.identifiers.type("B"),
          Token.operators.assignment,
          Token.identifiers.type("Foo"),
          Token.punctuation.typeParameters.begin,
          Token.keywords.typeof,
          Token.literals.stringQuoted("abc"),
          Token.punctuation.typeParameters.end,
          Token.punctuation.semicolon,
        ]);
      });
    });

    describe("decorators", () => {
      it("simple parameterless decorator", async () => {
        const tokens = await tokenize("@foo");
        deepStrictEqual(tokens, [Token.identifiers.tag("@"), Token.identifiers.tag("foo")]);
      });

      it("fully qualified decorator name", async () => {
        const tokens = await tokenize("@Foo.bar");
        if (tokenize === tokenizeTMLanguage) {
          deepStrictEqual(tokens, [Token.identifiers.tag("@"), Token.identifiers.tag("Foo.bar")]);
        } else {
          deepStrictEqual(tokens, [
            Token.identifiers.tag("@"),
            Token.identifiers.type("Foo"),
            Token.punctuation.accessor,
            Token.identifiers.tag("bar"),
          ]);
        }
      });

      it("decorator with parameters", async () => {
        const tokens = await tokenize(`@foo("param1", 123)`);
        deepStrictEqual(tokens, [
          Token.identifiers.tag("@"),
          Token.identifiers.tag("foo"),
          Token.punctuation.openParen,
          Token.literals.stringQuoted("param1"),
          Token.punctuation.comma,
          Token.literals.numeric("123"),
          Token.punctuation.closeParen,
        ]);
      });
    });

    describe("augment decorators", () => {
      const params = [
        Token.punctuation.openParen,
        Token.identifiers.type("MyModel"),
        Token.punctuation.comma,
        Token.literals.stringQuoted("param1"),
        Token.punctuation.comma,
        Token.literals.numeric("123"),
        Token.punctuation.closeParen,
      ];

      it("decorator", async () => {
        const tokens = await tokenize(`@@foo(MyModel, "param1", 123)`);
        deepStrictEqual(tokens, [
          Token.identifiers.tag("@@"),
          Token.identifiers.tag("foo"),
          ...params,
        ]);
      });

      it("fully qualified decorator name", async () => {
        const tokens = await tokenize(`@@Foo.bar(MyModel, "param1", 123)`);

        if (tokenize === tokenizeTMLanguage) {
          deepStrictEqual(tokens, [
            Token.identifiers.tag("@@"),
            Token.identifiers.tag("Foo.bar"),
            ...params,
          ]);
        } else {
          deepStrictEqual(tokens, [
            Token.identifiers.tag("@@"),
            Token.identifiers.type("Foo"),
            Token.punctuation.accessor,
            Token.identifiers.tag("bar"),
            ...params,
          ]);
        }
      });
    });

    describe("interfaces", () => {
      it("empty interface", async () => {
        const tokens = await tokenize("interface Foo {}");
        deepStrictEqual(tokens, [
          Token.keywords.interface,
          Token.identifiers.type("Foo"),
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });

      it("interface with single extends", async () => {
        const tokens = await tokenize("interface Foo extends Bar {}");
        deepStrictEqual(tokens, [
          Token.keywords.interface,
          Token.identifiers.type("Foo"),
          Token.keywords.extends,
          Token.identifiers.type("Bar"),
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });

      it("interface with multiple extends", async () => {
        const tokens = await tokenize("interface Foo extends Bar1, Bar2 {}");
        deepStrictEqual(tokens, [
          Token.keywords.interface,
          Token.identifiers.type("Foo"),
          Token.keywords.extends,
          Token.identifiers.type("Bar1"),
          Token.punctuation.comma,
          Token.identifiers.type("Bar2"),
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });

      it("template interface", async () => {
        const tokens = await tokenize("interface Foo<T> {}");
        deepStrictEqual(tokens, [
          Token.keywords.interface,
          Token.identifiers.type("Foo"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("T"),
          Token.punctuation.typeParameters.end,
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });

      it("template interface with extends", async () => {
        const tokens = await tokenize("interface Foo<T> extends Bar<T> {}");
        deepStrictEqual(tokens, [
          Token.keywords.interface,
          Token.identifiers.type("Foo"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("T"),
          Token.punctuation.typeParameters.end,
          Token.keywords.extends,
          Token.identifiers.type("Bar"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("T"),
          Token.punctuation.typeParameters.end,
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });

      it("interface with operations", async () => {
        const tokens = await tokenize(`
        interface Foo {
          bar(): string;
        }`);
        deepStrictEqual(tokens, [
          Token.keywords.interface,
          Token.identifiers.type("Foo"),
          Token.punctuation.openBrace,
          Token.identifiers.functionName("bar"),
          Token.punctuation.openParen,
          Token.punctuation.closeParen,
          Token.operators.typeAnnotation,
          Token.identifiers.type("string"),
          Token.punctuation.semicolon,
          Token.punctuation.closeBrace,
        ]);
      });

      it("interface operation that copies the signature of another operation", async () => {
        const tokens = await tokenize(`
        interface Foo {
          bar is ResourceRead<Widget>
        }`);

        deepStrictEqual(tokens, [
          Token.keywords.interface,
          Token.identifiers.type("Foo"),
          Token.punctuation.openBrace,
          Token.identifiers.functionName("bar"),
          Token.keywords.is,
          Token.identifiers.type("ResourceRead"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("Widget"),
          Token.punctuation.typeParameters.end,
          Token.punctuation.closeBrace,
        ]);
      });
    });

    describe("models", () => {
      it("simple model", async () => {
        const tokens = await tokenize("model Foo {}");
        deepStrictEqual(tokens, [
          Token.keywords.model,
          Token.identifiers.type("Foo"),
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });

      it("model with extends", async () => {
        const tokens = await tokenize("model Foo extends Bar {}");
        deepStrictEqual(tokens, [
          Token.keywords.model,
          Token.identifiers.type("Foo"),
          Token.keywords.extends,
          Token.identifiers.type("Bar"),
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });

      it("model with is", async () => {
        const tokens = await tokenize("model Foo is Bar {}");
        deepStrictEqual(tokens, [
          Token.keywords.model,
          Token.identifiers.type("Foo"),
          Token.keywords.is,
          Token.identifiers.type("Bar"),
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });

      it("model with is array expression", async () => {
        const tokens = await tokenize("model Foo is string[] {}");
        deepStrictEqual(tokens, [
          Token.keywords.model,
          Token.identifiers.type("Foo"),
          Token.keywords.is,
          Token.identifiers.type("string"),
          Token.punctuation.openBracket,
          Token.punctuation.closeBracket,
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });

      it("single template argument model", async () => {
        const tokens = await tokenize("model Foo<T> {}");
        deepStrictEqual(tokens, [
          Token.keywords.model,
          Token.identifiers.type("Foo"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("T"),
          Token.punctuation.typeParameters.end,
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });

      it("templated model with default", async () => {
        const tokens = await tokenize("model Foo<T = string> {}");
        deepStrictEqual(tokens, [
          Token.keywords.model,
          Token.identifiers.type("Foo"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("T"),
          Token.operators.assignment,
          Token.identifiers.type("string"),
          Token.punctuation.typeParameters.end,
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });
      it("templated model with constraint", async () => {
        const tokens = await tokenize("model Foo<T extends string> {}");
        deepStrictEqual(tokens, [
          Token.keywords.model,
          Token.identifiers.type("Foo"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("T"),
          Token.keywords.extends,
          Token.identifiers.type("string"),
          Token.punctuation.typeParameters.end,
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });

      it("multiple template argument model", async () => {
        const tokens = await tokenize("model Foo<A, B, C> {}");
        deepStrictEqual(tokens, [
          Token.keywords.model,
          Token.identifiers.type("Foo"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("A"),
          Token.punctuation.comma,
          Token.identifiers.type("B"),
          Token.punctuation.comma,
          Token.identifiers.type("C"),
          Token.punctuation.typeParameters.end,
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });

      it("model with basic properties", async () => {
        const tokens = await tokenize(`
          model Foo {
            prop1: string;
            prop2: int32;
          }`);
        deepStrictEqual(tokens, [
          Token.keywords.model,
          Token.identifiers.type("Foo"),
          Token.punctuation.openBrace,
          Token.identifiers.variable("prop1"),
          Token.operators.typeAnnotation,
          Token.identifiers.type("string"),
          Token.punctuation.semicolon,
          Token.identifiers.variable("prop2"),
          Token.operators.typeAnnotation,
          Token.identifiers.type("int32"),
          Token.punctuation.semicolon,
          Token.punctuation.closeBrace,
        ]);
      });

      it("model with optional properties", async () => {
        const tokens = await tokenize(`
        model Foo {
          prop1?: string;
        }`);
        deepStrictEqual(tokens, [
          Token.keywords.model,
          Token.identifiers.type("Foo"),
          Token.punctuation.openBrace,
          Token.identifiers.variable("prop1"),
          Token.operators.optional,
          Token.operators.typeAnnotation,
          Token.identifiers.type("string"),
          Token.punctuation.semicolon,
          Token.punctuation.closeBrace,
        ]);
      });

      it("model with properties with default value", async () => {
        const tokens = await tokenize(`
    model Foo {
      prop1?: string = "my-default";
    }`);
        deepStrictEqual(tokens, [
          Token.keywords.model,
          Token.identifiers.type("Foo"),
          Token.punctuation.openBrace,
          Token.identifiers.variable("prop1"),
          Token.operators.optional,
          Token.operators.typeAnnotation,
          Token.identifiers.type("string"),
          Token.operators.assignment,
          Token.literals.stringQuoted("my-default"),
          Token.punctuation.semicolon,
          Token.punctuation.closeBrace,
        ]);
      });

      it("nested model ", async () => {
        const tokens = await tokenize(`
        model Foo {
          nested: {
            prop1: string;
          };
        }`);
        deepStrictEqual(tokens, [
          Token.keywords.model,
          Token.identifiers.type("Foo"),
          Token.punctuation.openBrace,
          Token.identifiers.variable("nested"),
          Token.operators.typeAnnotation,
          Token.punctuation.openBrace,
          Token.identifiers.variable("prop1"),
          Token.operators.typeAnnotation,
          Token.identifiers.type("string"),
          Token.punctuation.semicolon,
          Token.punctuation.closeBrace,
          Token.punctuation.semicolon,
          Token.punctuation.closeBrace,
        ]);
      });

      it("model with spread property", async () => {
        const tokens = await tokenize(`
        model Foo {
          ...Bar;
        }`);
        deepStrictEqual(tokens, [
          Token.keywords.model,
          Token.identifiers.type("Foo"),
          Token.punctuation.openBrace,
          Token.operators.spread,
          Token.identifiers.type("Bar"),
          Token.punctuation.semicolon,
          Token.punctuation.closeBrace,
        ]);
      });
    });

    describe("scalar", () => {
      it("simple scalar", async () => {
        const tokens = await tokenize("scalar Foo;");
        deepStrictEqual(tokens, [
          Token.keywords.scalar,
          Token.identifiers.type("Foo"),
          Token.punctuation.semicolon,
        ]);
      });

      it("scalar with extends", async () => {
        const tokens = await tokenize("scalar Foo extends Bar;");
        deepStrictEqual(tokens, [
          Token.keywords.scalar,
          Token.identifiers.type("Foo"),
          Token.keywords.extends,
          Token.identifiers.type("Bar"),
          Token.punctuation.semicolon,
        ]);
      });

      it("single template argument model", async () => {
        const tokens = await tokenize("scalar Foo<T>;");
        deepStrictEqual(tokens, [
          Token.keywords.scalar,
          Token.identifiers.type("Foo"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("T"),
          Token.punctuation.typeParameters.end,
          Token.punctuation.semicolon,
        ]);
      });

      it("scalar with constructor", async () => {
        const tokens = await tokenize("scalar foo { init fromFoo(value: string); }");
        deepStrictEqual(tokens, [
          Token.keywords.scalar,
          Token.identifiers.type("foo"),
          Token.punctuation.openBrace,
          Token.keywords.init,
          Token.identifiers.functionName("fromFoo"),
          Token.punctuation.openParen,
          Token.identifiers.variable("value"),
          Token.operators.typeAnnotation,
          Token.identifiers.type("string"),
          Token.punctuation.closeParen,
          Token.punctuation.semicolon,
          Token.punctuation.closeBrace,
        ]);
      });

      it("scalar with body doesn't need semi colon for next statement", async () => {
        const tokens = await tokenize(`
          scalar foo { }
          scalar bar;
        `);
        deepStrictEqual(tokens, [
          Token.keywords.scalar,
          Token.identifiers.type("foo"),
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
          Token.keywords.scalar,
          Token.identifiers.type("bar"),
          Token.punctuation.semicolon,
        ]);
      });
    });

    describe("template argument", () => {
      it("multiple named arguments", async () => {
        const tokens = await tokenize("alias X = Foo<boolean, T = string, U = int32>;");
        deepStrictEqual(tokens, [
          Token.keywords.alias,
          Token.identifiers.type("X"),
          Token.operators.assignment,
          Token.identifiers.type("Foo"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("boolean"),
          Token.punctuation.comma,
          Token.identifiers.type("T"),
          Token.operators.assignment,
          Token.identifiers.type("string"),
          Token.punctuation.comma,
          Token.identifiers.type("U"),
          Token.operators.assignment,
          Token.identifiers.type("int32"),
          Token.punctuation.typeParameters.end,
          Token.punctuation.semicolon,
        ]);
      });

      it("multiple references", async () => {
        const tokens = await tokenize(`
          alias A = Foo<Parameters=string>;
          alias B = Foo<Parameters=string>;  
        `);
        deepStrictEqual(tokens, [
          Token.keywords.alias,
          Token.identifiers.type("A"),
          Token.operators.assignment,
          Token.identifiers.type("Foo"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("Parameters"),
          Token.operators.assignment,
          Token.identifiers.type("string"),
          Token.punctuation.typeParameters.end,
          Token.punctuation.semicolon,
          // --
          Token.keywords.alias,
          Token.identifiers.type("B"),
          Token.operators.assignment,
          Token.identifiers.type("Foo"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("Parameters"),
          Token.operators.assignment,
          Token.identifiers.type("string"),
          Token.punctuation.typeParameters.end,
          Token.punctuation.semicolon,
        ]);
      });
    });

    describe("enums", () => {
      it("simple enum", async () => {
        const tokens = await tokenize("enum Foo {}");
        deepStrictEqual(tokens, [
          Token.keywords.enum,
          Token.identifiers.type("Foo"),
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });

      it("enum with simple members", async () => {
        const tokens = await tokenize("enum Direction { up, down}");
        deepStrictEqual(tokens, [
          Token.keywords.enum,
          Token.identifiers.type("Direction"),
          Token.punctuation.openBrace,
          Token.identifiers.variable("up"),
          Token.punctuation.comma,
          Token.identifiers.variable("down"),
          Token.punctuation.closeBrace,
        ]);
      });

      it("enum with escaped identifiers", async () => {
        const tokens = await tokenize("enum Direction { `North West`, `North West`}");
        deepStrictEqual(tokens, [
          Token.keywords.enum,
          Token.identifiers.type("Direction"),
          Token.punctuation.openBrace,
          Token.identifiers.variable("`North West`"),
          Token.punctuation.comma,
          Token.identifiers.variable("`North West`"),
          Token.punctuation.closeBrace,
        ]);
      });

      it("enum with string values", async () => {
        const tokens = await tokenize(`enum Direction { up: "Up", down: "Down"}`);
        deepStrictEqual(tokens, [
          Token.keywords.enum,
          Token.identifiers.type("Direction"),
          Token.punctuation.openBrace,
          Token.identifiers.variable("up"),
          Token.operators.typeAnnotation,
          Token.literals.stringQuoted("Up"),
          Token.punctuation.comma,
          Token.identifiers.variable("down"),
          Token.operators.typeAnnotation,
          Token.literals.stringQuoted("Down"),
          Token.punctuation.closeBrace,
        ]);
      });
    });

    describe("union statements", () => {
      it("simple union", async () => {
        const tokens = await tokenize("union Foo {}");
        deepStrictEqual(tokens, [
          Token.keywords.union,
          Token.identifiers.type("Foo"),
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });

      it("union with unamed variants", async () => {
        const tokens = await tokenize(`union Direction { "up", string, 123 }`);
        deepStrictEqual(tokens, [
          Token.keywords.union,
          Token.identifiers.type("Direction"),
          Token.punctuation.openBrace,
          Token.literals.stringQuoted("up"),
          Token.punctuation.comma,
          Token.identifiers.type("string"),
          Token.punctuation.comma,
          Token.literals.numeric("123"),
          Token.punctuation.closeBrace,
        ]);
      });

      it("union with named variants", async () => {
        const tokens = await tokenize(`union Direction { up: "Up", down: "Down" }`);
        deepStrictEqual(tokens, [
          Token.keywords.union,
          Token.identifiers.type("Direction"),
          Token.punctuation.openBrace,
          Token.identifiers.variable("up"),
          Token.operators.typeAnnotation,
          Token.literals.stringQuoted("Up"),
          Token.punctuation.comma,
          Token.identifiers.variable("down"),
          Token.operators.typeAnnotation,
          Token.literals.stringQuoted("Down"),
          Token.punctuation.closeBrace,
        ]);
      });

      it("union with named variants with escaped identifier", async () => {
        const tokens = await tokenize(
          `union Direction { \`north east\`: "North East", \`north west\`: "North West" }`
        );
        deepStrictEqual(tokens, [
          Token.keywords.union,
          Token.identifiers.type("Direction"),
          Token.punctuation.openBrace,
          Token.identifiers.variable("`north east`"),
          Token.operators.typeAnnotation,
          Token.literals.stringQuoted("North East"),
          Token.punctuation.comma,
          Token.identifiers.variable("`north west`"),
          Token.operators.typeAnnotation,
          Token.literals.stringQuoted("North West"),
          Token.punctuation.closeBrace,
        ]);
      });
    });

    describe("namespaces", () => {
      it("simple global namespace", async () => {
        const tokens = await tokenize("namespace Foo;");
        deepStrictEqual(tokens, [
          Token.keywords.namespace,
          Token.identifiers.type("Foo"),
          Token.punctuation.semicolon,
        ]);
      });

      it("subnamespace global namespace", async () => {
        const tokens = await tokenize("namespace Foo.Bar;");
        deepStrictEqual(tokens, [
          Token.keywords.namespace,
          Token.identifiers.type("Foo"),
          Token.punctuation.accessor,
          Token.identifiers.type("Bar"),
          Token.punctuation.semicolon,
        ]);
      });

      it("simple namespace", async () => {
        const tokens = await tokenize(`
        namespace Foo {

        }`);
        deepStrictEqual(tokens, [
          Token.keywords.namespace,
          Token.identifiers.type("Foo"),
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
        ]);
      });

      it("nested namespace", async () => {
        const tokens = await tokenize(`
        namespace Foo {
          namespace Bar {
            
          }
        }`);
        deepStrictEqual(tokens, [
          Token.keywords.namespace,
          Token.identifiers.type("Foo"),
          Token.punctuation.openBrace,
          Token.keywords.namespace,
          Token.identifiers.type("Bar"),
          Token.punctuation.openBrace,
          Token.punctuation.closeBrace,
          Token.punctuation.closeBrace,
        ]);
      });
    });

    describe("operations", () => {
      it("simple operation", async () => {
        const tokens = await tokenize("op foo(): string");
        deepStrictEqual(tokens, [
          Token.keywords.operation,
          Token.identifiers.functionName("foo"),
          Token.punctuation.openParen,
          Token.punctuation.closeParen,
          Token.operators.typeAnnotation,
          Token.identifiers.type("string"),
        ]);
      });

      it("operation with parameters", async () => {
        const tokens = await tokenize("op foo(param1: string, param2: int32): string");
        deepStrictEqual(tokens, [
          Token.keywords.operation,
          Token.identifiers.functionName("foo"),
          Token.punctuation.openParen,

          Token.identifiers.variable("param1"),
          Token.operators.typeAnnotation,
          Token.identifiers.type("string"),
          Token.punctuation.comma,

          Token.identifiers.variable("param2"),
          Token.operators.typeAnnotation,
          Token.identifiers.type("int32"),

          Token.punctuation.closeParen,
          Token.operators.typeAnnotation,
          Token.identifiers.type("string"),
        ]);
      });

      it("model with properties with default value", async () => {
        const tokens = await tokenize(`op foo(param1?: string = "my-default"): string`);
        deepStrictEqual(tokens, [
          Token.keywords.operation,
          Token.identifiers.functionName("foo"),
          Token.punctuation.openParen,

          Token.identifiers.variable("param1"),
          Token.operators.optional,
          Token.operators.typeAnnotation,
          Token.identifiers.type("string"),
          Token.operators.assignment,
          Token.literals.stringQuoted("my-default"),

          Token.punctuation.closeParen,
          Token.operators.typeAnnotation,
          Token.identifiers.type("string"),
        ]);
      });

      it("operation with decorated parameters", async () => {
        const tokens = await tokenize(
          "op foo(@path param1: string, @query param2?: int32): string"
        );
        deepStrictEqual(tokens, [
          Token.keywords.operation,
          Token.identifiers.functionName("foo"),
          Token.punctuation.openParen,

          Token.identifiers.tag("@"),
          Token.identifiers.tag("path"),
          Token.identifiers.variable("param1"),
          Token.operators.typeAnnotation,
          Token.identifiers.type("string"),
          Token.punctuation.comma,

          Token.identifiers.tag("@"),
          Token.identifiers.tag("query"),
          Token.identifiers.variable("param2"),
          Token.operators.optional,
          Token.operators.typeAnnotation,
          Token.identifiers.type("int32"),

          Token.punctuation.closeParen,
          Token.operators.typeAnnotation,
          Token.identifiers.type("string"),
        ]);
      });

      it("operation that copies the signature of another operation", async () => {
        const tokens = await tokenize("op foo is ResourceRead<Widget>");
        deepStrictEqual(tokens, [
          Token.keywords.operation,
          Token.identifiers.functionName("foo"),
          Token.keywords.is,
          Token.identifiers.type("ResourceRead"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("Widget"),
          Token.punctuation.typeParameters.end,
        ]);
      });

      it("defining a templated operation signature", async () => {
        const tokens = await tokenize(
          "op ResourceRead<TResource> is ResourceReadBase<TResource, DefaultOptions>"
        );
        deepStrictEqual(tokens, [
          Token.keywords.operation,
          Token.identifiers.functionName("ResourceRead"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("TResource"),
          Token.punctuation.typeParameters.end,
          Token.keywords.is,
          Token.identifiers.type("ResourceReadBase"),
          Token.punctuation.typeParameters.begin,
          Token.identifiers.type("TResource"),
          Token.punctuation.comma,
          Token.identifiers.type("DefaultOptions"),
          Token.punctuation.typeParameters.end,
        ]);
      });
    });

    describe("const", () => {
      it("without type annotation", async () => {
        const tokens = await tokenize("const foo = 123;");
        deepStrictEqual(tokens, [
          Token.keywords.const,
          Token.identifiers.variable("foo"),
          Token.operators.assignment,
          Token.literals.numeric("123"),
          Token.punctuation.semicolon,
        ]);
      });

      it("with type annotation", async () => {
        const tokens = await tokenize("const foo: int32 = 123;");
        deepStrictEqual(tokens, [
          Token.keywords.const,
          Token.identifiers.variable("foo"),
          Token.operators.typeAnnotation,
          Token.identifiers.type("int32"),
          Token.operators.assignment,
          Token.literals.numeric("123"),
          Token.punctuation.semicolon,
        ]);
      });
    });

    describe("call expressions", () => {
      it("without parameters", async () => {
        const tokens = await tokenizeWithConst("foo()");
        deepStrictEqual(tokens, [
          Token.identifiers.functionName("foo"),
          Token.punctuation.openParen,
          Token.punctuation.closeParen,
        ]);
      });
    });

    describe("object literals", () => {
      it("empty", async () => {
        const tokens = await tokenizeWithConst("#{}");
        deepStrictEqual(tokens, [Token.punctuation.openHashBrace, Token.punctuation.closeBrace]);
      });

      it("single prop", async () => {
        const tokens = await tokenizeWithConst(`#{name: "John"}`);
        deepStrictEqual(tokens, [
          Token.punctuation.openHashBrace,
          Token.identifiers.variable("name"),
          Token.operators.typeAnnotation,
          Token.literals.stringQuoted("John"),
          Token.punctuation.closeBrace,
        ]);
      });

      it("multiple prop", async () => {
        const tokens = await tokenizeWithConst(`#{name: "John", age: 21}`);
        deepStrictEqual(tokens, [
          Token.punctuation.openHashBrace,
          Token.identifiers.variable("name"),
          Token.operators.typeAnnotation,
          Token.literals.stringQuoted("John"),
          Token.punctuation.comma,
          Token.identifiers.variable("age"),
          Token.operators.typeAnnotation,
          Token.literals.numeric("21"),
          Token.punctuation.closeBrace,
        ]);
      });

      it("spreading prop", async () => {
        const tokens = await tokenizeWithConst(`#{name: "John", ...Common}`);
        deepStrictEqual(tokens, [
          Token.punctuation.openHashBrace,
          Token.identifiers.variable("name"),
          Token.operators.typeAnnotation,
          Token.literals.stringQuoted("John"),
          Token.punctuation.comma,
          Token.operators.spread,
          Token.identifiers.type("Common"),
          Token.punctuation.closeBrace,
        ]);
      });

      it("nested prop", async () => {
        const tokens = await tokenizeWithConst(`#{prop: #{age: 21}}`);
        deepStrictEqual(tokens, [
          Token.punctuation.openHashBrace,
          Token.identifiers.variable("prop"),
          Token.operators.typeAnnotation,
          Token.punctuation.openHashBrace,
          Token.identifiers.variable("age"),
          Token.operators.typeAnnotation,
          Token.literals.numeric("21"),
          Token.punctuation.closeBrace,
          Token.punctuation.closeBrace,
        ]);
      });
    });

    describe("array literals", () => {
      it("empty", async () => {
        const tokens = await tokenizeWithConst("#[]");
        deepStrictEqual(tokens, [
          Token.punctuation.openHashBracket,
          Token.punctuation.closeBracket,
        ]);
      });

      it("single value", async () => {
        const tokens = await tokenizeWithConst(`#["John"]`);
        deepStrictEqual(tokens, [
          Token.punctuation.openHashBracket,
          Token.literals.stringQuoted("John"),
          Token.punctuation.closeBracket,
        ]);
      });

      it("multiple values", async () => {
        const tokens = await tokenizeWithConst(`#["John", 21]`);
        deepStrictEqual(tokens, [
          Token.punctuation.openHashBracket,
          Token.literals.stringQuoted("John"),
          Token.punctuation.comma,
          Token.literals.numeric("21"),
          Token.punctuation.closeBracket,
        ]);
      });

      it("nested tuple", async () => {
        const tokens = await tokenizeWithConst(`#[#[21]]`);
        deepStrictEqual(tokens, [
          Token.punctuation.openHashBracket,
          Token.punctuation.openHashBracket,
          Token.literals.numeric("21"),
          Token.punctuation.closeBracket,
          Token.punctuation.closeBracket,
        ]);
      });
    });

    describe("decorator declarations", () => {
      it("extern decorator", async () => {
        const tokens = await tokenize("extern dec tag(target: Namespace);");
        deepStrictEqual(tokens, [
          Token.keywords.extern,
          Token.keywords.dec,
          Token.identifiers.functionName("tag"),
          Token.punctuation.openParen,
          Token.identifiers.variable("target"),
          Token.operators.typeAnnotation,
          Token.identifiers.type("Namespace"),
          Token.punctuation.closeParen,
          Token.punctuation.semicolon,
        ]);
      });
    });

    describe("function declarations", () => {
      it("extern fn", async () => {
        const tokens = await tokenize("extern fn camelCase(target: StringLiteral): StringLiteral;");
        deepStrictEqual(tokens, [
          Token.keywords.extern,
          Token.keywords.fn,
          Token.identifiers.functionName("camelCase"),
          Token.punctuation.openParen,
          Token.identifiers.variable("target"),
          Token.operators.typeAnnotation,
          Token.identifiers.type("StringLiteral"),
          Token.punctuation.closeParen,
          Token.operators.typeAnnotation,
          Token.identifiers.type("StringLiteral"),
          Token.punctuation.semicolon,
        ]);
      });
    });

    if (tokenize === tokenizeTMLanguage) {
      describe("comments", () => {
        it("tokenize empty line comment", async () => {
          const tokens = await tokenize(`
        //
        `);
          deepStrictEqual(tokens, [Token.comment.line("//")]);
        });
        it("tokenize line comment", async () => {
          const tokens = await tokenize(`
        // This is a line comment
        `);
          deepStrictEqual(tokens, [Token.comment.line("// This is a line comment")]);
        });
        it("tokenize line comment before statement", async () => {
          const tokens = await tokenize(`
        // Comment
        model Foo {}
        `);
          deepStrictEqual(tokens, [
            Token.comment.line("// Comment"),
            Token.keywords.model,
            Token.identifiers.type("Foo"),
            Token.punctuation.openBrace,
            Token.punctuation.closeBrace,
          ]);
        });

        it("tokenize single line block comment", async () => {
          const tokens = await tokenize(`
          /* Comment */
          `);
          deepStrictEqual(tokens, [
            Token.comment.block("/*"),
            Token.comment.block(" Comment "),
            Token.comment.block("*/"),
          ]);
        });

        it("tokenize multi line block comment", async () => {
          const tokens = await tokenize(`
          /*
            Comment
            on multi line
          */
          `);
          deepStrictEqual(tokens, [
            Token.comment.block("/*"),
            Token.comment.block("            Comment"),
            Token.comment.block("            on multi line"),
            Token.comment.block("          "),
            Token.comment.block("*/"),
          ]);
        });

        describe("in template parameters", () => {
          it.each([
            [
              "alias",
              `alias Foo<T // comment
                > = T`,
            ],
            [
              "model",
              `model Foo<T // comment
                > {}`,
            ],
            [
              "union",
              `union Foo<T // comment
                > {}`,
            ],
            [
              "interface",
              `interface Foo<T // comment
                > {}`,
            ],
            [
              "operation",
              `op foo<T // comment
                >(): void;`,
            ],
          ])("%s", async () => {
            const tokens = await tokenize(`alias Foo<T // comment
            > = T`);

            const index = tokens.findIndex((x) =>
              deepEquals(x, Token.punctuation.typeParameters.begin)
            );
            deepStrictEqual(tokens.slice(index, index + 4), [
              Token.punctuation.typeParameters.begin,
              Token.identifiers.type("T"),
              Token.comment.line("// comment"),
              Token.punctuation.typeParameters.end,
            ]);
          });
        });
      });
    }

    /**
     * Doc comment
     * @param foo Foo desc
     */
    describe("doc comments", () => {
      async function tokenizeDocComment(text: string) {
        const tokens = await tokenize(text);
        return tokens.filter((x) => !(x.scope === "comment.block.tsp"));
      }

      const common = [
        Token.keywords.alias,
        Token.identifiers.type("A"),
        Token.operators.assignment,
        Token.literals.numeric("1"),
        Token.punctuation.semicolon,
      ];
      it("tokenize @param", async () => {
        const tokens = await tokenizeDocComment(
          `/**
            * Doc comment
            * @param foo Foo desc
            */
          alias A = 1;`
        );

        deepStrictEqual(tokens, [
          Token.tspdoc.tag("@"),
          Token.tspdoc.tag("param"),
          Token.identifiers.variable("foo"),
          ...common,
        ]);
      });

      it("tokenize @template", async () => {
        const tokens = await tokenizeDocComment(
          `/**
            * Doc comment
            * @template foo Foo desc
            */
          alias A = 1;`
        );

        deepStrictEqual(tokens, [
          Token.tspdoc.tag("@"),
          Token.tspdoc.tag("template"),
          Token.identifiers.variable("foo"),
          ...common,
        ]);
      });

      it("tokenize @prop", async () => {
        const tokens = await tokenizeDocComment(
          `/**
            * Doc comment
            * @prop foo Foo desc
            */
          alias A = 1;`
        );

        deepStrictEqual(tokens, [
          Token.tspdoc.tag("@"),
          Token.tspdoc.tag("prop"),
          Token.identifiers.variable("foo"),
          ...common,
        ]);
      });

      it("tokenize @returns", async () => {
        const tokens = await tokenizeDocComment(
          `/**
            * Doc comment
            * @returns Foo desc
            */
          alias A = 1;`
        );

        deepStrictEqual(tokens, [Token.tspdoc.tag("@"), Token.tspdoc.tag("returns"), ...common]);
      });
      it("tokenize @custom", async () => {
        const tokens = await tokenizeDocComment(
          `/**
            * Doc comment
            * @custom Foo desc
            */
          alias A = 1;`
        );

        deepStrictEqual(tokens, [
          Token.identifiers.tag("@"),
          Token.identifiers.tag("custom"),
          ...common,
        ]);
      });
    });

    describe("projections", () => {
      it("simple projection", async () => {
        const tokens = await tokenize(`
      projection op#foo {
        to(arg1) {
          calling(arg1);
        }
      }
      `);
        deepStrictEqual(tokens, [
          Token.keywords.projection,
          Token.keywords.operation,
          Token.operators.selector,
          Token.identifiers.variable("foo"),
          Token.punctuation.openBrace,
          Token.keywords.to,
          Token.punctuation.openParen,
          Token.identifiers.variable("arg1"),
          Token.punctuation.closeParen,
          Token.punctuation.openBrace,
          Token.identifiers.functionName("calling"),
          Token.punctuation.openParen,
          Token.identifiers.type("arg1"),
          Token.punctuation.closeParen,
          Token.punctuation.semicolon,
          Token.punctuation.closeBrace,
          Token.punctuation.closeBrace,
        ]);
      });

      async function testProjectionBody(body: string, expectedTokens: Token[]) {
        const tokens = await tokenize(`
      projection op#foo {
        to(arg1) {
          ${body}
        }
      }
      `);
        deepStrictEqual(tokens, [
          Token.keywords.projection,
          Token.keywords.operation,
          Token.operators.selector,
          Token.identifiers.variable("foo"),
          Token.punctuation.openBrace,
          Token.keywords.to,
          Token.punctuation.openParen,
          Token.identifiers.variable("arg1"),
          Token.punctuation.closeParen,
          Token.punctuation.openBrace,
          ...expectedTokens,
          Token.punctuation.closeBrace,
          Token.punctuation.closeBrace,
        ]);
      }

      it("if expression with body", async () => {
        await testProjectionBody(
          `
        if hasFoo(arg1) {
          doFoo(arg1);
        };
      `,
          [
            Token.keywords.if,
            Token.identifiers.functionName("hasFoo"),
            Token.punctuation.openParen,
            Token.identifiers.type("arg1"),
            Token.punctuation.closeParen,
            Token.punctuation.openBrace,
            Token.identifiers.functionName("doFoo"),
            Token.punctuation.openParen,
            Token.identifiers.type("arg1"),
            Token.punctuation.closeParen,
            Token.punctuation.semicolon,
            Token.punctuation.closeBrace,
            Token.punctuation.semicolon,
          ]
        );
      });

      it("if, else if, else expression", async () => {
        await testProjectionBody(
          `
        if hasFoo() {
        } else if hasBar() {
        } else {
        };
      `,
          [
            Token.keywords.if,
            Token.identifiers.functionName("hasFoo"),
            Token.punctuation.openParen,
            Token.punctuation.closeParen,
            Token.punctuation.openBrace,
            Token.punctuation.closeBrace,

            Token.keywords.else,
            Token.keywords.if,
            Token.identifiers.functionName("hasBar"),
            Token.punctuation.openParen,
            Token.punctuation.closeParen,
            Token.punctuation.openBrace,
            Token.punctuation.closeBrace,

            Token.keywords.else,
            Token.punctuation.openBrace,
            Token.punctuation.closeBrace,

            Token.punctuation.semicolon,
          ]
        );
      });

      it("property accessor", async () => {
        await testProjectionBody(
          `
        doFoo(self::name);
        `,
          [
            Token.identifiers.functionName("doFoo"),
            Token.punctuation.openParen,
            Token.identifiers.type("self"),
            ...(tokenize === tokenizeSemantic ? [Token.punctuation.valueAccessor] : []),
            Token.identifiers.type("name"),
            Token.punctuation.closeParen,
            Token.punctuation.semicolon,
          ]
        );
      });
    });
  });

  async function tokenizeWithConst(text: string) {
    const common = [
      Token.keywords.const,
      Token.identifiers.variable("a"),
      Token.operators.assignment,
    ];
    const tokens = await tokenize(`const a = ${text}`);
    for (let i = 0; i < common.length; i++) {
      deepStrictEqual(tokens[i], common[i]);
    }

    return tokens.slice(common.length);
  }
}

const punctuationMap = getPunctuationMap();

export async function tokenizeSemantic(input: string): Promise<Token[]> {
  const host = await createTestServerHost();
  const file = createSourceFile(input, "untitled:test");
  const document = host.addOrUpdateDocument("untitled:test", input);
  const semanticTokens = await host.server.getSemanticTokens({ textDocument: document });
  const tokens = [];

  let templateStack = 0;
  for (const semanticToken of semanticTokens) {
    const text = file.text.substring(semanticToken.pos, semanticToken.end);
    if (text === "${" && semanticToken.kind === SemanticTokenKind.Operator) {
      templateStack++;
      tokens.push(Token.punctuation.templateExpression.begin);
    } else if (
      templateStack > 0 &&
      text === "}" &&
      semanticToken.kind === SemanticTokenKind.Operator
    ) {
      templateStack--;
      tokens.push(Token.punctuation.templateExpression.end);
    } else {
      const token = convertSemanticToken(semanticToken, text);
      if (token) {
        tokens.push(token);
      }
    }
  }

  return tokens;

  function convertSemanticToken(token: SemanticToken, text: string): Token | undefined {
    switch (token.kind) {
      case SemanticTokenKind.Namespace:
      case SemanticTokenKind.Type:
      case SemanticTokenKind.Class:
      case SemanticTokenKind.Enum:
      case SemanticTokenKind.Interface:
      case SemanticTokenKind.Struct:
      case SemanticTokenKind.TypeParameter:
        return Token.identifiers.type(text);
      case SemanticTokenKind.Parameter:
      case SemanticTokenKind.Property:
      case SemanticTokenKind.Variable:
      case SemanticTokenKind.EnumMember:
        return Token.identifiers.variable(text);
      case SemanticTokenKind.Function:
        return Token.identifiers.functionName(text);
      case SemanticTokenKind.Macro:
        return Token.identifiers.tag(text);
      case SemanticTokenKind.Keyword:
        return Token.keywords.other(text);
      case SemanticTokenKind.String:
        return text.startsWith(`"""`)
          ? Token.literals.stringTriple(text)
          : Token.literals.string(text);
      case SemanticTokenKind.Comment:
        return Token.comment.block(text);
      case SemanticTokenKind.Number:
        return Token.literals.numeric(text);
      case SemanticTokenKind.Operator:
        if (text === "@") return Token.identifiers.tag("@");
        if (text === "@@") return Token.identifiers.tag("@@");
        const punctuation = punctuationMap.get(text);
        ok(punctuation, `No tmlanguage equivalent for punctuation: "${text}".`);
        return punctuation;
      case SemanticTokenKind.DocCommentTag:
        return Token.tspdoc.tag(text);
      default:
        ok(false, "Unexpected SemanticTokenKind: " + SemanticTokenKind[token.kind]);
    }
  }
}

async function createOnigLib(): Promise<IOnigLib> {
  const require = createRequire(import.meta.url);
  const onigWasm = await readFile(`${dirname(require.resolve("vscode-oniguruma"))}/onig.wasm`);

  await loadWASM(onigWasm.buffer);

  return {
    createOnigScanner: (sources) => createOnigScanner(sources),
    createOnigString,
  };
}

const registry = new Registry({
  onigLib: createOnigLib(),
  loadGrammar: async () => {
    const data = await readFile(
      resolve(await findTestPackageRoot(import.meta.url), "dist/typespec.tmLanguage"),
      "utf-8"
    );
    return parseRawGrammar(data);
  },
});

const excludedScopes = ["source.tsp"];

export async function tokenizeTMLanguage(input: string | Input): Promise<Token[]> {
  if (typeof input === "string") {
    input = Input.fromText(input);
  }

  const tokens: Token[] = [];
  let previousStack: StateStack | null = null;
  const grammar = await registry.loadGrammar("source.tsp");

  if (grammar === null) {
    throw new Error("Unexpected null grammar");
  }

  for (let lineIndex = 0; lineIndex < input.lines.length; lineIndex++) {
    const line = input.lines[lineIndex];

    const lineResult = grammar.tokenizeLine(line, previousStack);
    previousStack = lineResult.ruleStack;

    if (lineIndex < input.span.startLine || lineIndex > input.span.endLine) {
      continue;
    }

    for (const token of lineResult.tokens) {
      if (
        (lineIndex === input.span.startLine && token.startIndex < input.span.startIndex) ||
        (lineIndex === input.span.endLine && token.endIndex > input.span.endIndex)
      ) {
        continue;
      }

      const text = line.substring(token.startIndex, token.endIndex);
      const scope = token.scopes[token.scopes.length - 1];

      if (!excludeScope(scope)) {
        tokens.push(createToken(text, scope as TokenScope));
      }
    }

    for (let i = 0; i < tokens.length - 2; i++) {
      // For some reason we get strings as three tokens from API, combine them.
      // Inspect tokens in VS Code shows only one token as expected and as combined here.
      if (tokens[i].text === '"' && tokens[i + 2].text === '"') {
        tokens[i].text = '"' + tokens[i + 1].text + '"';
        tokens.splice(i + 1, 2);
      }
    }
  }

  return tokens;
}

function excludeScope(scope: string) {
  return excludedScopes.includes(scope) || scope.startsWith("meta.");
}

interface Span {
  startLine: number;
  startIndex: number;
  endLine: number;
  endIndex: number;
}

class Input {
  private constructor(
    public lines: string[],
    public span: Span
  ) {}

  public static fromText(text: string) {
    // ensure consistent line-endings irrelevant of OS
    text = text.replace("\r\n", "\n");
    const lines = text.split("\n");

    return new Input(lines, {
      startLine: 0,
      startIndex: 0,
      endLine: lines.length - 1,
      endIndex: lines[lines.length - 1].length,
    });
  }
}

function getPunctuationMap(): ReadonlyMap<string, Token> {
  const map = new Map();
  visit(Token.punctuation);
  visit(Token.operators);
  return map;

  function visit(obj: Record<string, any>) {
    for (const value of Object.values(obj)) {
      if ("text" in value) {
        map.set(value.text, value);
      } else {
        if (value !== Token.punctuation.templateExpression) {
          visit(value);
        }
      }
    }
  }
}
