import type { languages } from "monaco-editor-core";

const bounded = (text: string) => `\\b${text}\\b`;
const notBefore = (regex: string) => `(?!${regex})`;

const identifierStart = "[_a-zA-Z]";
const identifierContinue = "[_a-zA-Z0-9]";
const identifier = bounded(`${identifierStart}${identifierContinue}*`);
const directive = bounded(`[_a-zA-Z-0-9]+`);

const keywords = [
  "const",
  "import",
  "model",
  "scalar",
  "namespace",
  "op",
  "interface",
  "union",
  "using",
  "is",
  "extends",
  "enum",
  "alias",
  "return",
  "void",
  "if",
  "else",
  "projection",
  "dec",
  "extern",
  "fn",
];
const namedLiterals = ["true", "false", "null", "unknown", "never"];
const nonCommentWs = `[ \\t\\r\\n]`;
const numericLiteral = `[0-9]+`;

export default {
  defaultToken: "",
  tokenPostfix: ".tsp",
  brackets: [
    { open: "{", close: "}", token: "delimiter.curly" },
    { open: "[", close: "]", token: "delimiter.square" },
    { open: "(", close: ")", token: "delimiter.parenthesis" },
  ],
  symbols: /[=:;<>]+/,
  keywords,
  namedLiterals,
  escapes: `\\\\(u{[0-9A-Fa-f]+}|n|r|t|\\\\|"|\\\${)`,
  tokenizer: {
    root: [{ include: "@expression" }, { include: "@whitespace" }],
    stringVerbatim: [
      { regex: `(|"|"")[^"]`, action: { token: "string" } },
      { regex: `"""${notBefore(`"`)}`, action: { token: "string", next: "@pop" } },
    ],
    stringLiteral: [
      { regex: `\\\${`, action: { token: "delimiter.bracket", next: "@bracketCounting" } },
      { regex: `[^\\\\"$]+`, action: { token: "string" } },
      { regex: "@escapes", action: { token: "string.escape" } },
      { regex: `\\\\.`, action: { token: "string.escape.invalid" } },
      { regex: `"`, action: { token: "string", next: "@pop" } },
    ],
    bracketCounting: [
      { regex: `{`, action: { token: "delimiter.bracket", next: "@bracketCounting" } },
      { regex: `}`, action: { token: "delimiter.bracket", next: "@pop" } },
      { include: "@expression" },
    ],
    comment: [
      { regex: `[^\\*]+`, action: { token: "comment" } },
      { regex: `\\*\\/`, action: { token: "comment", next: "@pop" } },
      { regex: `[\\/*]`, action: { token: "comment" } },
    ],
    whitespace: [
      { regex: nonCommentWs },
      { regex: `\\/\\*`, action: { token: "comment", next: "@comment" } },
      { regex: `\\/\\/.*$`, action: { token: "comment" } },
    ],
    expression: [
      { regex: `"""`, action: { token: "string", next: "@stringVerbatim" } },
      { regex: `"${notBefore(`""`)}`, action: { token: "string", next: "@stringLiteral" } },
      { regex: numericLiteral, action: { token: "number" } },
      {
        regex: identifier,
        action: {
          cases: {
            "@keywords": { token: "keyword" },
            "@namedLiterals": { token: "keyword" },
            "@default": { token: "identifier" },
          },
        },
      },
      { regex: `@${identifier}`, action: { token: "tag" } },
      { regex: `#${directive}`, action: { token: "directive" } },
    ],
  },
} satisfies languages.IMonarchLanguage;
