// TextMate-based syntax highlighting is implemented in this file.
// cadl.tmLanguage is generated by running this script.

import fs from "fs/promises";
import mkdirp from "mkdirp";
import { resolve } from "path";
import * as tm from "tmlanguage-generator";

type IncludeRule = tm.IncludeRule<CadlScope>;
type BeginEndRule = tm.BeginEndRule<CadlScope>;
type MatchRule = tm.MatchRule<CadlScope>;
type Grammar = tm.Grammar<CadlScope>;

export type CadlScope =
  | "comment.block.cadl"
  | "comment.line.double-slash.cadl"
  | "constant.character.escape.cadl"
  | "constant.numeric.cadl"
  | "constant.language.cadl"
  | "keyword.directive.name.cadl"
  | "entity.name.type.cadl"
  | "entity.name.function.cadl"
  | "keyword.other.cadl"
  | "string.quoted.double.cadl"
  | "string.quoted.triple.cadl"
  | "variable.name.cadl"
  // Operators
  | "keyword.operator.type.annotation.cadl"
  | "keyword.operator.optional.cadl"
  | "keyword.operator.spread.cadl"
  // Punctuation
  | "punctuation.comma.cadl"
  | "punctuation.accessor.cadl"
  | "punctuation.terminator.statement.cadl"
  | "punctuation.definition.typeparameters.begin.cadl"
  | "punctuation.definition.typeparameters.end.cadl"
  | "punctuation.squarebracket.open.cadl"
  | "punctuation.squarebracket.close.cadl"
  | "punctuation.curlybrace.open.cadl"
  | "punctuation.curlybrace.close.cadl"
  | "punctuation.parenthesis.open.cadl"
  | "punctuation.parenthesis.close.cadl";

const meta: typeof tm.meta = tm.meta;
const identifierStart = "[_$[:alpha:]]";
const identifierContinue = "[_$[:alnum:]]";
const beforeIdentifier = `(?=${identifierStart})`;
const identifier = `\\b${identifierStart}${identifierContinue}*\\b`;
const qualifiedIdentifier = `\\b${identifierStart}(${identifierContinue}|\\.${identifierStart})*\\b`;
const stringPattern = '\\"(?:[^\\"\\\\]|\\\\.)*\\"';
const statementKeyword = `\\b(?:namespace|model|op|using|import|enum|alias|union|interface)\\b`;
const universalEnd = `(?=,|;|@|\\)|\\}|${statementKeyword})`;
const universalEndExceptComma = `(?=;|@|\\)|\\}|${statementKeyword})`;
const hexNumber = "\\b(?<!\\$)0(?:x|X)[0-9a-fA-F][0-9a-fA-F_]*(n)?\\b(?!\\$)";
const binaryNumber = "\\b(?<!\\$)0(?:b|B)[01][01_]*(n)?\\b(?!\\$)";
const decimalNumber =
  "(?<!\\$)(?:" +
  "(?:\\b[0-9][0-9_]*(\\.)[0-9][0-9_]*[eE][+-]?[0-9][0-9_]*(n)?\\b)|" + // 1.1E+3
  "(?:\\b[0-9][0-9_]*(\\.)[eE][+-]?[0-9][0-9_]*(n)?\\b)|" + // 1.E+3
  "(?:\\B(\\.)[0-9][0-9_]*[eE][+-]?[0-9][0-9_]*(n)?\\b)|" + // .1E+3
  "(?:\\b[0-9][0-9_]*[eE][+-]?[0-9][0-9_]*(n)?\\b)|" + // 1E+3
  "(?:\\b[0-9][0-9_]*(\\.)[0-9][0-9_]*(n)?\\b)|" + // 1.1
  "(?:\\b[0-9][0-9_]*(\\.)(n)?\\B)|" + // 1.
  "(?:\\B(\\.)[0-9][0-9_]*(n)?\\b)|" + // .1
  "(?:\\b[0-9][0-9_]*(n)?\\b(?!\\.))" + // 1
  ")(?!\\$)";
const anyNumber = `(?:${hexNumber}|${binaryNumber}|${decimalNumber})`;

const expression: IncludeRule = {
  key: "expression",
  patterns: [
    /* placeholder filled later due to cycle*/
  ],
};

const statement: IncludeRule = {
  key: "statement",
  patterns: [
    /*placeholder filled later due to cycle*/
  ],
};

const booleanLiteral: MatchRule = {
  key: "boolean-literal",
  scope: "constant.language.cadl",
  match: `\\b(true|false)\\b`,
};

const escapeChar: MatchRule = {
  key: "escape-character",
  scope: "constant.character.escape.cadl",
  match: "\\\\.",
};

const stringLiteral: BeginEndRule = {
  key: "string-literal",
  scope: "string.quoted.double.cadl",
  begin: '"',
  end: '"|$',
  patterns: [escapeChar],
};

const tripleQuotedStringLiteral: BeginEndRule = {
  key: "triple-quoted-string-literal",
  scope: "string.quoted.triple.cadl",
  begin: '"""',
  end: '"""',
  patterns: [escapeChar],
};

const punctuationComma: MatchRule = {
  key: "punctuation-comma",
  scope: "punctuation.comma.cadl",
  match: ",",
};
const punctuationAccessor: MatchRule = {
  key: "punctuation-accessor",
  scope: "punctuation.accessor.cadl",
  match: "\\.",
};

const punctuationSemicolon: MatchRule = {
  key: "punctuation-semicolon",
  scope: "punctuation.terminator.statement.cadl",
  match: ";",
};

const numericLiteral: MatchRule = {
  key: "numeric-literal",
  scope: "constant.numeric.cadl",
  match: anyNumber,
};

const lineComment: MatchRule = {
  key: "line-comment",
  scope: "comment.line.double-slash.cadl",
  match: "//.*$",
};

const blockComment: BeginEndRule = {
  key: "block-comment",
  scope: "comment.block.cadl",
  begin: "/\\*",
  end: "\\*/",
};

// Tokens that match standing alone in any context: literals and comments
const token: IncludeRule = {
  key: "token",
  patterns: [
    lineComment,
    blockComment,
    // `"""` must come before `"` or first two quotes of `"""` will match as
    // empty string
    tripleQuotedStringLiteral,
    stringLiteral,
    booleanLiteral,
    numericLiteral,
  ],
};

const parenthesizedExpression: BeginEndRule = {
  key: "parenthesized-expression",
  scope: meta,
  begin: "\\(",
  beginCaptures: {
    "0": { scope: "punctuation.parenthesis.open.cadl" },
  },
  end: "\\)",
  endCaptures: {
    "0": { scope: "punctuation.parenthesis.close.cadl" },
  },
  patterns: [expression, punctuationComma],
};

const decorator: BeginEndRule = {
  key: "decorator",
  scope: meta,
  begin: `@(${qualifiedIdentifier})`,
  beginCaptures: {
    "1": { scope: "entity.name.function.cadl" },
  },
  end: `${beforeIdentifier}|${universalEnd}`,
  patterns: [token, parenthesizedExpression],
};

const identifierExpression: MatchRule = {
  key: "identifier-expression",
  scope: "entity.name.type.cadl",
  match: identifier,
};

const typeArguments: BeginEndRule = {
  key: "type-arguments",
  scope: meta,
  begin: "<",
  beginCaptures: {
    "0": { scope: "punctuation.definition.typeparameters.begin.cadl" },
  },
  end: ">",
  endCaptures: {
    "0": { scope: "punctuation.definition.typeparameters.end.cadl" },
  },
  patterns: [expression, punctuationComma],
};

const tupleExpression: BeginEndRule = {
  key: "tuple-expression",
  scope: meta,
  begin: "\\[",
  end: "\\]",
  patterns: [expression],
};

const typeAnnotation: BeginEndRule = {
  key: "type-annotation",
  scope: meta,
  begin: "\\s*(\\??)\\s*(:)",
  beginCaptures: {
    "1": { scope: "keyword.operator.optional.cadl" },
    "2": { scope: "keyword.operator.type.annotation.cadl" },
  },
  end: universalEnd,
  patterns: [expression],
};

const modelProperty: BeginEndRule = {
  key: "model-property",
  scope: meta,
  begin: `(?:(${identifier})|(${stringPattern}))`,
  beginCaptures: {
    "1": { scope: "variable.name.cadl" },
    "2": { scope: "string.quoted.double.cadl" },
  },
  end: universalEnd,
  patterns: [token, typeAnnotation],
};

const modelSpreadProperty: BeginEndRule = {
  key: "model-spread-property",
  scope: meta,
  begin: "\\.\\.\\.",
  beginCaptures: {
    "0": { scope: "keyword.operator.spread.cadl" },
  },
  end: universalEnd,
  patterns: [expression],
};

const directive: BeginEndRule = {
  key: "directive",
  scope: meta,
  begin: `(#${identifier})`,
  beginCaptures: {
    "1": { scope: "keyword.directive.name.cadl" },
  },
  end: `$|${universalEnd}`,
  patterns: [stringLiteral, identifierExpression],
};

const modelExpression: BeginEndRule = {
  key: "model-expression",
  scope: meta,
  begin: "\\{",
  beginCaptures: {
    "0": { scope: "punctuation.curlybrace.open.cadl" },
  },
  end: "\\}",
  endCaptures: {
    "0": { scope: "punctuation.curlybrace.close.cadl" },
  },
  patterns: [
    // modelProperty must come before token or quoted property name will be
    // considered an arbitrarily positioned string literal and not match as part
    // of modelProperty begin.
    modelProperty,
    token,
    directive,
    decorator,
    modelSpreadProperty,
    punctuationSemicolon,
  ],
};

const modelHeritage: BeginEndRule = {
  key: "model-heritage",
  scope: meta,
  begin: "\\b(extends|is)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.cadl" },
  },
  end: `((?=\\{)|${universalEndExceptComma})`,
  patterns: [expression],
};

const modelStatement: BeginEndRule = {
  key: "model-statement",
  scope: meta,
  begin: "\\b(model)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.cadl" },
  },
  end: `(?<=\\})|${universalEnd}`,
  patterns: [
    token,
    modelHeritage, // before expression or `extends` or `is` will look like type name
    expression, // enough to match name, type parameters, and body.
  ],
};

const enumStatement: BeginEndRule = {
  key: "enum-statement",
  scope: meta,
  begin: "\\b(enum)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.cadl" },
  },
  end: `(?<=\\})|${universalEnd}`,
  patterns: [token, expression],
};

const unionStatement: BeginEndRule = {
  key: "union-statement",
  scope: meta,
  begin: "\\b(union)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.cadl" },
  },
  end: `(?<=\\})|${universalEnd}`,
  patterns: [token, expression],
};

const aliasStatement: BeginEndRule = {
  key: "alias-statement",
  scope: meta,
  begin: "\\b(alias)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.cadl" },
  },
  end: universalEnd,
  patterns: [token, expression],
};

const namespaceName: BeginEndRule = {
  key: "namespace-name",
  scope: meta,
  begin: beforeIdentifier,
  end: `((?=\\{)|${universalEnd})`,
  patterns: [identifierExpression, punctuationAccessor],
};

const namespaceBody: BeginEndRule = {
  key: "namespace-body",
  scope: meta,
  begin: "\\{",
  beginCaptures: {
    "0": { scope: "punctuation.curlybrace.open.cadl" },
  },
  end: "\\}",
  endCaptures: {
    "0": { scope: "punctuation.curlybrace.close.cadl" },
  },
  patterns: [statement],
};

const namespaceStatement: BeginEndRule = {
  key: "namespace-statement",
  scope: meta,
  begin: "\\b(namespace)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.cadl" },
  },
  end: `((?<=\\})|${universalEnd})`,
  patterns: [token, namespaceName, namespaceBody],
};

const functionName: MatchRule = {
  key: "function-name",
  scope: "entity.name.function.cadl",
  match: identifier,
};

const operationName: BeginEndRule = {
  key: "operation-name",
  scope: meta,
  begin: beforeIdentifier,
  end: `((?=\\()|${universalEnd})`,
  patterns: [token, functionName],
};

const operationParameters: BeginEndRule = {
  key: "operation-parameters",
  scope: meta,
  begin: "\\(",
  beginCaptures: {
    "0": { scope: "punctuation.parenthesis.open.cadl" },
  },
  end: "\\)",
  endCaptures: {
    "0": { scope: "punctuation.parenthesis.close.cadl" },
  },
  patterns: [token, decorator, modelProperty, modelSpreadProperty, punctuationComma],
};

const operationStatement: BeginEndRule = {
  key: "operation-statement",
  scope: meta,
  begin: "\\b(op)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.cadl" },
  },
  end: universalEnd,
  patterns: [
    token,
    operationName,
    operationParameters,
    typeAnnotation, // return type
  ],
};

const interfaceMember: BeginEndRule = {
  key: "interface-member",
  scope: meta,
  begin: `(?:(${identifier}))`,
  beginCaptures: {
    "1": { scope: "entity.name.function.cadl" },
  },
  end: universalEnd,
  patterns: [token, operationParameters, typeAnnotation],
};

const interfaceHeritage: BeginEndRule = {
  key: "interface-heritage",
  scope: meta,
  begin: "\\b(mixes)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.cadl" },
  },
  end: `((?=\\{)|${universalEndExceptComma})`,
  patterns: [expression],
};

const interfaceBody: BeginEndRule = {
  key: "interface-body",
  scope: meta,
  begin: "\\{",
  end: "\\}",
  patterns: [token, directive, decorator, interfaceMember],
};

const interfaceStatement: BeginEndRule = {
  key: "interface-statement",
  scope: meta,
  begin: "\\b(interface)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.cadl" },
  },
  end: `(?<=\\})|${universalEnd}`,
  patterns: [
    token,
    interfaceHeritage, // before expression or mixes will look like type name
    interfaceBody, // before expression or { will match model expression
    expression, // enough to match name and type parameters
  ],
};

const importStatement: BeginEndRule = {
  key: "import-statement",
  scope: meta,
  begin: "\\b(import)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.cadl" },
  },
  end: universalEnd,
  patterns: [token],
};

const usingStatement: BeginEndRule = {
  key: "using-statement",
  scope: meta,
  begin: "\\b(using)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.cadl" },
  },
  end: universalEnd,
  patterns: [token, identifierExpression],
};

// NOTE: We don't actually classify all the different expression types and their
// punctuation yet. For now, at least, we only deal with the ones that would
// break coloring due to breaking out of context inappropriately with parens/
// braces/brackets that weren't handled with appropriate precedence. The other
// expressions color acceptably as unclassified punctuation around those we do
// handle here.
expression.patterns = [
  token,
  directive,
  parenthesizedExpression,
  typeArguments,
  tupleExpression,
  modelExpression,
  identifierExpression,
];

statement.patterns = [
  token,
  directive,
  decorator,
  modelStatement,
  unionStatement,
  interfaceStatement,
  enumStatement,
  aliasStatement,
  namespaceStatement,
  operationStatement,
  importStatement,
  usingStatement,
  punctuationSemicolon,
];

const grammar: Grammar = {
  $schema: tm.schema,
  name: "Cadl",
  scopeName: "source.cadl",
  fileTypes: [".cadl"],
  patterns: [statement],
};

export async function main() {
  const plist = await tm.emitPList(grammar, {
    errorSourceFilePath: resolve("./src/tmlanguage.ts"),
  });
  await mkdirp("./dist");
  await fs.writeFile("./dist/cadl.tmLanguage", plist);
}
