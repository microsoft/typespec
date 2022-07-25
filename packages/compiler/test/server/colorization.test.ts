import { deepStrictEqual, ok } from "assert";
import { readFile } from "fs/promises";
import { createRequire } from "module";
import path, { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import vscode_oniguruma from "vscode-oniguruma";
import vscode_textmate, { IOnigLib, StackElement } from "vscode-textmate";
import { createSourceFile } from "../../core/diagnostics.js";
import { SemanticToken, SemanticTokenKind } from "../../server/serverlib.js";
import { CadlScope } from "../../server/tmlanguage.js";
import { createTestServerHost } from "../../testing/test-server-host.js";

const { parseRawGrammar, Registry } = vscode_textmate;
const { createOnigScanner, createOnigString, loadWASM } = vscode_oniguruma;

export type MetaScope = `meta.${string}.cadl`;
export type TokenScope = CadlScope | MetaScope;

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
    model: createToken("model", "keyword.other.cadl"),
    operation: createToken("op", "keyword.other.cadl"),
    namespace: createToken("namespace", "keyword.other.cadl"),
    interface: createToken("interface", "keyword.other.cadl"),
    alias: createToken("alias", "keyword.other.cadl"),
    extends: createToken("extends", "keyword.other.cadl"),
    is: createToken("is", "keyword.other.cadl"),
    other: (text: string) => createToken(text, "keyword.other.cadl"),
  },

  meta: (text: string, meta: string) => createToken(text, `meta.${meta}.cadl`),

  identifiers: {
    variable: (name: string) => createToken(name, "variable.name.cadl"),
    functionName: (name: string) => createToken(name, "entity.name.function.cadl"),
    tag: (name: string) => createToken(name, "entity.name.tag.cadl"),
    type: (name: string) => createToken(name, "entity.name.type.cadl"),
  },

  operators: {
    assignment: createToken("=", "keyword.operator.assignment.cadl"),
    optional: createToken("?", "keyword.operator.optional.cadl"),
    typeAnnotation: createToken(":", "keyword.operator.type.annotation.cadl"),
    spread: createToken("...", "keyword.operator.spread.cadl"),
  },

  punctuation: {
    comma: createToken(",", "punctuation.comma.cadl"),
    accessor: createToken(".", "punctuation.accessor.cadl"),
    openBracket: createToken("[", "punctuation.squarebracket.open.cadl"),
    closeBracket: createToken("]", "punctuation.squarebracket.close.cadl"),
    openBrace: createToken("{", "punctuation.curlybrace.open.cadl"),
    closeBrace: createToken("}", "punctuation.curlybrace.close.cadl"),
    openParen: createToken("(", "punctuation.parenthesis.open.cadl"),
    closeParen: createToken(")", "punctuation.parenthesis.close.cadl"),
    semicolon: createToken(";", "punctuation.terminator.statement.cadl"),

    typeParameters: {
      begin: createToken("<", "punctuation.definition.typeparameters.begin.cadl"),
      end: createToken(">", "punctuation.definition.typeparameters.end.cadl"),
    },
  },

  literals: {
    numeric: (text: string) => createToken(text, "constant.numeric.cadl"),
    string: (text: string) =>
      createToken(text.startsWith('"') ? text : '"' + text + '"', "string.quoted.double.cadl"),
  },
} as const;

testColorization("semantic colorization", tokenizeSemantic);
testColorization("tmlanguage", tokenizeTMLanguage);

function testColorization(description: string, tokenize: Tokenize) {
  describe(`compiler: server: ${description}`, () => {
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
    });

    describe("decorators", () => {
      it("simple parameterless decorator", async () => {
        const tokens = await tokenize("@foo");
        deepStrictEqual(tokens, [Token.identifiers.tag("@foo")]);
      });

      it("fully qualified decorator name", async () => {
        const tokens = await tokenize("@Foo.bar");
        if (tokenize === tokenizeTMLanguage) {
          deepStrictEqual(tokens, [Token.identifiers.tag("@Foo.bar")]);
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
          Token.identifiers.tag("@foo"),
          Token.punctuation.openParen,
          Token.literals.string("param1"),
          Token.punctuation.comma,
          Token.literals.numeric("123"),
          Token.punctuation.closeParen,
        ]);
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
          Token.literals.string("my-default"),
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
          Token.literals.string("my-default"),

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

          Token.identifiers.tag("@path"),
          Token.identifiers.variable("param1"),
          Token.operators.typeAnnotation,
          Token.identifiers.type("string"),
          Token.punctuation.comma,

          Token.identifiers.tag("@query"),
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
  });
}

const punctuationMap = getPunctuationMap();

export async function tokenizeSemantic(input: string): Promise<Token[]> {
  const host = await createTestServerHost();
  const file = createSourceFile(input, "untitled:test");
  const document = host.addOrUpdateDocument("untitled:test", input);
  const semanticTokens = await host.server.getSemanticTokens({ textDocument: document });
  const tokens = [];

  for (const semanticToken of semanticTokens) {
    const text = file.text.substring(semanticToken.pos, semanticToken.end);
    const token = convertSemanticToken(semanticToken, text);
    if (token) {
      tokens.push(token);
    }
  }

  // Make @dec one token to match tmlanguage
  for (let i = 0; i < tokens.length - 1; i++) {
    if (
      tokens[i].scope === "entity.name.tag.cadl" &&
      tokens[i].text === "@" &&
      tokens[i + 1].scope === "entity.name.tag.cadl"
    ) {
      tokens[i].text = "@" + tokens[i + 1].text;
      tokens.splice(i + 1, 1);
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
        return Token.literals.string(text);
      case SemanticTokenKind.Number:
        return Token.literals.numeric(text);
      case SemanticTokenKind.Operator:
        if (text === "@") return Token.identifiers.tag("@");
        const punctuation = punctuationMap.get(text);
        ok(punctuation, "No tmlanugage equivalent for punctuation: " + text);
        return punctuation;
      default:
        ok(false, "Unexpected SemanticTokenKind: " + SemanticTokenKind[token.kind]);
    }
  }
}

async function createOnigLib(): Promise<IOnigLib> {
  const require = createRequire(import.meta.url);
  const onigWasm = await readFile(`${path.dirname(require.resolve("vscode-oniguruma"))}/onig.wasm`);

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
      resolve(dirname(fileURLToPath(import.meta.url)), "../../cadl.tmLanguage"),
      "utf-8"
    );
    return parseRawGrammar(data);
  },
});

const excludedScopes = ["source.cadl"];

export async function tokenizeTMLanguage(input: string | Input): Promise<Token[]> {
  if (typeof input === "string") {
    input = Input.fromText(input);
  }

  const tokens: Token[] = [];
  let previousStack: StackElement | null = null;
  const grammar = await registry.loadGrammar("source.cadl");

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
  private constructor(public lines: string[], public span: Span) {}

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
        visit(value);
      }
    }
  }
}
