import { deepStrictEqual } from "assert";
import { writeFile } from "fs/promises";
import type { Token as MonacoToken } from "monaco-editor-core";
import { editor, languages } from "monaco-editor-core/esm/vs/editor/editor.api.js";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { afterAll, beforeAll, it, type TestFunction } from "vitest";
import lang from "../src/typespec-monarch.js";

interface MonacoTestFormat {
  line: string;
  tokens: any[];
}

const lines: MonacoTestFormat[][] = [];
beforeAll(() => {
  lines.length = 0;
  languages.register({ id: "typespec" });
  languages.setMonarchTokensProvider("typespec", lang);
});

afterAll(async () => {
  // Write the test format expected in monaco-editor repo. You can then copy the content to the test file and update src/basic-languages/typespec/typespec.test.ts
  await writeFile(
    resolve(fileURLToPath(import.meta.url), "../../temp/monaco-tests.json"),
    JSON.stringify(lines, null, 2),
  );
});

interface Token {
  text: string;
  type: string;
}

const Token = {
  keyword: (text: string) => ({ type: "keyword.tsp", text }),
  identifier: (text: string) => ({ type: "identifier.tsp", text }),
  default: (text: string) => ({ type: "", text }),
  quote: { type: "string.quote.tsp", text: `"` },
  stringQuoted: (text: string) => ({ type: "string.tsp", text: `"${text}"` }),
  string: (text: string) => ({ type: "string.tsp", text }),
};

function simplifyTokens(text: string, tokens: MonacoToken[][]) {
  const result = [];

  const lines = text.split("\n");

  for (const [lineIndex, lineTokens] of tokens.entries()) {
    const line = lines[lineIndex];
    for (const [index, token] of lineTokens.entries()) {
      const nextOffset = lineTokens[index + 1]?.offset ?? line.length;
      let tokenText = line.slice(token.offset, nextOffset);
      if (token.type === "") {
        tokenText = tokenText.trim();
        if (tokenText === "") continue;
      }
      result.push({ type: token.type, text: tokenText });
    }
  }

  return result;
}

function tokenize(text: string) {
  const tokensByLine = editor.tokenize(text, "typespec");
  const textLines = text.split("\n");
  const group: MonacoTestFormat[] = [];
  for (const [lineIndex, tokens] of tokensByLine.entries()) {
    group.push({
      line: textLines[lineIndex],
      tokens: tokens.map((x) => ({ startIndex: x.offset, type: x.type })),
    });
  }
  lines.push(group);
  return simplifyTokens(text, tokensByLine);
}

function tokenizeTo(expected: Token[]): TestFunction {
  return (context) => {
    const tokens = tokenize(context.task.name);
    deepStrictEqual(tokens, expected);
  };
}

it(
  `import "@typespec/http";`,
  tokenizeTo([Token.keyword("import"), Token.stringQuoted("@typespec/http"), Token.default(";")]),
);

it(
  "using TypeSpec.Http",
  tokenizeTo([
    Token.keyword("using"),
    Token.identifier("TypeSpec"),
    Token.default("."),
    Token.identifier("Http"),
  ]),
);
it(
  "namespace Foo {}",
  tokenizeTo([Token.keyword("namespace"), Token.identifier("Foo"), Token.default("{}")]),
);

it(
  `namespace Foo {
    model Bar {}
  }`,
  tokenizeTo([
    Token.keyword("namespace"),
    Token.identifier("Foo"),
    Token.default("{"),
    Token.keyword("model"),
    Token.identifier("Bar"),
    Token.default("{}"),
    Token.default("}"),
  ]),
);

it(
  "model Foo {}",
  tokenizeTo([Token.keyword("model"), Token.identifier("Foo"), Token.default("{}")]),
);

it(
  "model Foo is Bar;",
  tokenizeTo([
    Token.keyword("model"),
    Token.identifier("Foo"),
    Token.keyword("is"),
    Token.identifier("Bar"),
    Token.default(";"),
  ]),
);
it(
  "model Foo extends Bar;",
  tokenizeTo([
    Token.keyword("model"),
    Token.identifier("Foo"),
    Token.keyword("extends"),
    Token.identifier("Bar"),
    Token.default(";"),
  ]),
);

it(
  "interface Foo {}",
  tokenizeTo([Token.keyword("interface"), Token.identifier("Foo"), Token.default("{}")]),
);

it(
  "union Foo {}",
  tokenizeTo([Token.keyword("union"), Token.identifier("Foo"), Token.default("{}")]),
);

it(
  "scalar foo extends string;",
  tokenizeTo([
    Token.keyword("scalar"),
    Token.identifier("foo"),
    Token.keyword("extends"),
    Token.identifier("string"),
    Token.default(";"),
  ]),
);

it(
  "op test(): void;",
  tokenizeTo([
    Token.keyword("op"),
    Token.identifier("test"),
    Token.default("():"),
    Token.keyword("void"),
    Token.default(";"),
  ]),
);

it(
  "enum Direction { up, down }",
  tokenizeTo([
    Token.keyword("enum"),
    Token.identifier("Direction"),
    Token.default("{"),
    Token.identifier("up"),
    Token.default(","),
    Token.identifier("down"),
    Token.default("}"),
  ]),
);

it(
  `alias Foo = "a" | "b";`,
  tokenizeTo([
    Token.keyword("alias"),
    Token.identifier("Foo"),
    Token.default("="),
    Token.stringQuoted("a"),
    Token.default("|"),
    Token.stringQuoted("b"),
    Token.default(";"),
  ]),
);

it(
  `alias T =  """
  this
  is
  multiline
  """`,
  tokenizeTo([
    Token.keyword("alias"),
    Token.identifier("T"),
    Token.default("="),
    Token.string(`"""`),
    Token.string(`  this`),
    Token.string(`  is`),
    Token.string(`  multiline`),
    Token.string(`  """`),
  ]),
);

it(
  `const a = #{name: "abc"};`,
  tokenizeTo([
    Token.keyword("const"),
    Token.identifier("a"),
    Token.default("= #{"),
    Token.identifier("name"),
    Token.default(":"),
    Token.stringQuoted("abc"),
    Token.default("};"),
  ]),
);
