// TextMate-based syntax highlighting is implemented in this file.
// typespec.tmLanguage is generated by running this script.

import { mkdir, writeFile } from "fs/promises";
import { resolve } from "path";
import * as tm from "tmlanguage-generator";

type IncludeRule = tm.IncludeRule<TypeSpecScope>;
type BeginEndRule = tm.BeginEndRule<TypeSpecScope>;
type MatchRule = tm.MatchRule<TypeSpecScope>;
type Grammar = tm.Grammar<TypeSpecScope>;

export type TypeSpecScope =
  // Comments
  | "comment.block.tsp"
  | "comment.line.double-slash.tsp"
  // Constants
  | "constant.character.escape.tsp"
  | "constant.numeric.tsp"
  | "constant.language.tsp"
  // Keywords
  | "keyword.directive.name.tsp"
  | "keyword.other.tsp"
  | "keyword.tag.tspdoc"
  // Entities
  | "entity.name.type.tsp"
  | "entity.name.function.tsp"
  | "entity.name.tag.tsp"
  | "entity.name.function.macro.tsp"
  // Strings
  | "string.quoted.double.tsp"
  | "string.quoted.triple.tsp"
  // Variables
  | "variable.name.tsp"
  // Operators
  | "keyword.operator.type.annotation.tsp"
  | "keyword.operator.assignment.tsp"
  | "keyword.operator.optional.tsp"
  | "keyword.operator.selector.tsp"
  | "keyword.operator.spread.tsp"
  // Punctuation
  | "punctuation.comma.tsp"
  | "punctuation.accessor.tsp"
  | "punctuation.terminator.statement.tsp"
  | "punctuation.definition.typeparameters.begin.tsp"
  | "punctuation.definition.typeparameters.end.tsp"
  | "punctuation.definition.template-expression.begin.tsp"
  | "punctuation.definition.template-expression.end.tsp"
  | "punctuation.squarebracket.open.tsp"
  | "punctuation.squarebracket.close.tsp"
  | "punctuation.curlybrace.open.tsp"
  | "punctuation.curlybrace.close.tsp"
  | "punctuation.parenthesis.open.tsp"
  | "punctuation.parenthesis.close.tsp";

const meta: typeof tm.meta = tm.meta;
const identifierStart = "[_$[:alpha:]]";
// cspell:disable-next-line
const identifierContinue = "[_$[:alnum:]]";
const beforeIdentifier = `(?=${identifierStart})`;
const identifier = `\\b${identifierStart}${identifierContinue}*\\b`;
const qualifiedIdentifier = `\\b${identifierStart}(${identifierContinue}|\\.${identifierStart})*\\b`;
const stringPattern = '\\"(?:[^\\"\\\\]|\\\\.)*\\"';
const modifierKeyword = `\\b(?:extern)\\b`;
const statementKeyword = `\\b(?:namespace|model|op|using|import|enum|alias|union|interface|dec|fn)\\b`;
const universalEnd = `(?=,|;|@|\\)|\\}|${modifierKeyword}|${statementKeyword})`;
const universalEndExceptComma = `(?=;|@|\\)|\\}|${modifierKeyword}|${statementKeyword})`;

/**
 * Universal end with extra end char: `=`
 */
const expressionEnd = `(?=,|;|@|\\)|\\}|=|${statementKeyword})`;
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
  scope: "constant.language.tsp",
  match: `\\b(true|false)\\b`,
};

const escapeChar: MatchRule = {
  key: "escape-character",
  scope: "constant.character.escape.tsp",
  match: "\\\\.",
};

const templateExpression: BeginEndRule = {
  key: "template-expression",
  scope: meta,
  begin: "\\$\\{",
  beginCaptures: {
    "0": { scope: "punctuation.definition.template-expression.begin.tsp" },
  },
  end: "\\}",
  endCaptures: {
    "0": { scope: "punctuation.definition.template-expression.end.tsp" },
  },
  patterns: [expression],
};

const stringLiteral: BeginEndRule = {
  key: "string-literal",
  scope: "string.quoted.double.tsp",
  begin: '"',
  end: '"|$',
  patterns: [templateExpression, escapeChar],
};

const tripleQuotedStringLiteral: BeginEndRule = {
  key: "triple-quoted-string-literal",
  scope: "string.quoted.triple.tsp",
  begin: '"""',
  end: '"""',
  patterns: [templateExpression, escapeChar],
};

const punctuationComma: MatchRule = {
  key: "punctuation-comma",
  scope: "punctuation.comma.tsp",
  match: ",",
};

const punctuationAccessor: MatchRule = {
  key: "punctuation-accessor",
  scope: "punctuation.accessor.tsp",
  match: "\\.",
};

const punctuationSemicolon: MatchRule = {
  key: "punctuation-semicolon",
  scope: "punctuation.terminator.statement.tsp",
  match: ";",
};

const operatorAssignment: MatchRule = {
  key: "operator-assignment",
  scope: "keyword.operator.assignment.tsp",
  match: "=",
};

const numericLiteral: MatchRule = {
  key: "numeric-literal",
  scope: "constant.numeric.tsp",
  match: anyNumber,
};

const lineComment: MatchRule = {
  key: "line-comment",
  scope: "comment.line.double-slash.tsp",
  match: "//.*$",
};

const blockComment: BeginEndRule = {
  key: "block-comment",
  scope: "comment.block.tsp",
  begin: "/\\*",
  end: "\\*/",
};

const docCommentParam: MatchRule = {
  key: "doc-comment-param",
  scope: "comment.block.tsp",
  match: `(?x)((@)(?:param|template))\\s+(${identifier})\\b`,
  captures: {
    "1": { scope: "keyword.tag.tspdoc" },
    "2": { scope: "keyword.tag.tspdoc" },
    "3": { scope: "variable.name.tsp" },
  },
};
const docCommentReturn: MatchRule = {
  key: "doc-comment-return-tag",
  scope: "comment.block.tsp",
  match: `(?x)((@)(?:returns))\\b`,
  captures: {
    "1": { scope: "keyword.tag.tspdoc" },
    "2": { scope: "keyword.tag.tspdoc" },
  },
};
const docCommentUnknownTag: MatchRule = {
  key: "doc-comment-unknown-tag",
  scope: "comment.block.tsp",
  match: `(?x)((@)(?:${identifier}))\\b`,
  captures: {
    "1": { scope: "entity.name.tag.tsp" },
    "2": { scope: "entity.name.tag.tsp" },
  },
};

const docCommentBlock: IncludeRule = {
  key: "doc-comment-block",
  patterns: [docCommentParam, docCommentReturn, docCommentUnknownTag],
};

const docComment: BeginEndRule = {
  key: "doc-comment",
  scope: "comment.block.tsp",
  begin: "/\\*\\*",
  beginCaptures: {
    "0": { scope: "comment.block.tsp" },
  },
  end: "\\*/",
  endCaptures: {
    "0": { scope: "comment.block.tsp" },
  },
  patterns: [docCommentBlock],
};

// Tokens that match standing alone in any context: literals and comments
const token: IncludeRule = {
  key: "token",
  patterns: [
    docComment,
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
    "0": { scope: "punctuation.parenthesis.open.tsp" },
  },
  end: "\\)",
  endCaptures: {
    "0": { scope: "punctuation.parenthesis.close.tsp" },
  },
  patterns: [expression, punctuationComma],
};

const decorator: BeginEndRule = {
  key: "decorator",
  scope: meta,
  begin: `((@)${qualifiedIdentifier})`,
  beginCaptures: {
    "1": { scope: "entity.name.tag.tsp" },
    "2": { scope: "entity.name.tag.tsp" },
  },
  end: `${beforeIdentifier}|${universalEnd}`,
  patterns: [token, parenthesizedExpression],
};

const augmentDecoratorStatement: BeginEndRule = {
  key: "augment-decorator-statement",
  scope: meta,
  begin: `((@@)${qualifiedIdentifier})`,
  beginCaptures: {
    "1": { scope: "entity.name.tag.tsp" },
    "2": { scope: "entity.name.tag.tsp" },
  },
  end: `${beforeIdentifier}|${universalEnd}`,
  patterns: [token, parenthesizedExpression],
};

const identifierExpression: MatchRule = {
  key: "identifier-expression",
  scope: "entity.name.type.tsp",
  match: identifier,
};

const valueOfExpression: BeginEndRule = {
  key: "valueof",
  scope: meta,
  begin: `\\b(valueof)`,
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
  },
  end: `(?=>)|${universalEnd}`,
  patterns: [expression],
};

const typeArguments: BeginEndRule = {
  key: "type-arguments",
  scope: meta,
  begin: "<",
  beginCaptures: {
    "0": { scope: "punctuation.definition.typeparameters.begin.tsp" },
  },
  end: ">",
  endCaptures: {
    "0": { scope: "punctuation.definition.typeparameters.end.tsp" },
  },
  patterns: [identifierExpression, operatorAssignment, expression, punctuationComma],
};

const typeParameterConstraint: BeginEndRule = {
  key: "type-parameter-constraint",
  scope: meta,
  begin: `extends`,
  beginCaptures: {
    "0": { scope: "keyword.other.tsp" },
  },
  end: `(?=>)|${universalEnd}`,
  patterns: [expression],
};

const typeParameterDefault: BeginEndRule = {
  key: "type-parameter-default",
  scope: meta,
  begin: `=`,
  beginCaptures: {
    "0": { scope: "keyword.operator.assignment.tsp" },
  },
  end: `(?=>)|${universalEnd}`,
  patterns: [expression],
};

const typeParameter: BeginEndRule = {
  key: "type-parameter",
  scope: meta,
  begin: `(${identifier})`,
  beginCaptures: {
    "1": { scope: "entity.name.type.tsp" },
  },
  end: `(?=>)|${universalEnd}`,
  patterns: [typeParameterConstraint, typeParameterDefault],
};

const typeParameters: BeginEndRule = {
  key: "type-parameters",
  scope: meta,
  begin: "<",
  beginCaptures: {
    "0": { scope: "punctuation.definition.typeparameters.begin.tsp" },
  },
  end: ">",
  endCaptures: {
    "0": { scope: "punctuation.definition.typeparameters.end.tsp" },
  },
  patterns: [typeParameter, punctuationComma],
};

const tupleExpression: BeginEndRule = {
  key: "tuple-expression",
  scope: meta,
  begin: "\\[",
  beginCaptures: {
    "0": { scope: "punctuation.squarebracket.open.tsp" },
  },
  end: "\\]",
  endCaptures: {
    "0": { scope: "punctuation.squarebracket.close.tsp" },
  },
  patterns: [expression],
};

const typeAnnotation: BeginEndRule = {
  key: "type-annotation",
  scope: meta,
  begin: "\\s*(\\??)\\s*(:)",
  beginCaptures: {
    "1": { scope: "keyword.operator.optional.tsp" },
    "2": { scope: "keyword.operator.type.annotation.tsp" },
  },
  end: expressionEnd,
  patterns: [expression],
};

const modelProperty: BeginEndRule = {
  key: "model-property",
  scope: meta,
  begin: `(?:(${identifier})|(${stringPattern}))`,
  beginCaptures: {
    "1": { scope: "variable.name.tsp" },
    "2": { scope: "string.quoted.double.tsp" },
  },
  end: universalEnd,
  patterns: [token, typeAnnotation, operatorAssignment, expression],
};

const modelSpreadProperty: BeginEndRule = {
  key: "model-spread-property",
  scope: meta,
  begin: "\\.\\.\\.",
  beginCaptures: {
    "0": { scope: "keyword.operator.spread.tsp" },
  },
  end: universalEnd,
  patterns: [expression],
};

const directive: BeginEndRule = {
  key: "directive",
  scope: meta,
  begin: `\\s*(#${identifier})`,
  beginCaptures: {
    "1": { scope: "keyword.directive.name.tsp" },
  },
  end: `$|${universalEnd}`,
  patterns: [stringLiteral, identifierExpression],
};

const modelExpression: BeginEndRule = {
  key: "model-expression",
  scope: meta,
  begin: "\\{",
  beginCaptures: {
    "0": { scope: "punctuation.curlybrace.open.tsp" },
  },
  end: "\\}",
  endCaptures: {
    "0": { scope: "punctuation.curlybrace.close.tsp" },
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
    "1": { scope: "keyword.other.tsp" },
  },
  end: `((?=\\{)|${universalEndExceptComma})`,
  patterns: [expression, punctuationComma],
};

const modelStatement: BeginEndRule = {
  key: "model-statement",
  scope: meta,
  begin: "\\b(model)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
  },
  end: `(?<=\\})|${universalEnd}`,
  patterns: [
    token,
    typeParameters,
    modelHeritage, // before expression or `extends` or `is` will look like type name
    expression, // enough to match name, type parameters, and body.
  ],
};

const scalarExtends: BeginEndRule = {
  key: "scalar-extends",
  scope: meta,
  begin: "\\b(extends)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
  },
  end: universalEndExceptComma,
  patterns: [expression, punctuationComma],
};

const scalarStatement: BeginEndRule = {
  key: "scalar-statement",
  scope: meta,
  begin: "\\b(scalar)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
  },
  end: universalEnd,
  patterns: [
    token,
    typeParameters,
    scalarExtends, // before expression or `extends` will look like type name
    expression, // enough to match name, type parameters, and body.
  ],
};

const enumStatement: BeginEndRule = {
  key: "enum-statement",
  scope: meta,
  begin: "\\b(enum)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
  },
  end: `(?<=\\})|${universalEnd}`,
  patterns: [token, expression],
};

const unionStatement: BeginEndRule = {
  key: "union-statement",
  scope: meta,
  begin: "\\b(union)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
  },
  end: `(?<=\\})|${universalEnd}`,
  patterns: [token, expression],
};

const aliasStatement: BeginEndRule = {
  key: "alias-statement",
  scope: meta,
  begin: "\\b(alias)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
  },
  end: universalEnd,
  patterns: [typeParameters, operatorAssignment, expression],
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
    "0": { scope: "punctuation.curlybrace.open.tsp" },
  },
  end: "\\}",
  endCaptures: {
    "0": { scope: "punctuation.curlybrace.close.tsp" },
  },
  patterns: [statement],
};

const namespaceStatement: BeginEndRule = {
  key: "namespace-statement",
  scope: meta,
  begin: "\\b(namespace)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
  },
  end: `((?<=\\})|${universalEnd})`,
  patterns: [token, namespaceName, namespaceBody],
};

const operationParameters: BeginEndRule = {
  key: "operation-parameters",
  scope: meta,
  begin: "\\(",
  beginCaptures: {
    "0": { scope: "punctuation.parenthesis.open.tsp" },
  },
  end: "\\)",
  endCaptures: {
    "0": { scope: "punctuation.parenthesis.close.tsp" },
  },
  patterns: [token, decorator, modelProperty, modelSpreadProperty, punctuationComma],
};

const operationHeritage: BeginEndRule = {
  key: "operation-heritage",
  scope: meta,
  begin: "\\b(is)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
  },
  end: universalEnd,
  patterns: [expression],
};

const operationSignature: IncludeRule = {
  key: "operation-signature",
  patterns: [
    typeParameters,
    operationHeritage,
    operationParameters,
    typeAnnotation, // return type
  ],
};

const operationStatement: BeginEndRule = {
  key: "operation-statement",
  scope: meta,
  begin: `\\b(op)\\b\\s+(${identifier})`,
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
    "2": { scope: "entity.name.function.tsp" },
  },
  end: universalEnd,
  patterns: [token, operationSignature],
};

const interfaceMember: BeginEndRule = {
  key: "interface-member",
  scope: meta,
  begin: `(?:\\b(op)\\b\\s+)?(${identifier})`,
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
    "2": { scope: "entity.name.function.tsp" },
  },
  end: universalEnd,
  patterns: [token, operationSignature],
};

const interfaceHeritage: BeginEndRule = {
  key: "interface-heritage",
  scope: meta,
  begin: "\\b(extends)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
  },
  end: `((?=\\{)|${universalEndExceptComma})`,
  patterns: [expression, punctuationComma],
};

const interfaceBody: BeginEndRule = {
  key: "interface-body",
  scope: meta,
  begin: "\\{",
  beginCaptures: {
    "0": { scope: "punctuation.curlybrace.open.tsp" },
  },
  end: "\\}",
  endCaptures: {
    "0": { scope: "punctuation.curlybrace.close.tsp" },
  },
  patterns: [token, directive, decorator, interfaceMember, punctuationSemicolon],
};

const interfaceStatement: BeginEndRule = {
  key: "interface-statement",
  scope: meta,
  begin: "\\b(interface)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
  },
  end: `(?<=\\})|${universalEnd}`,
  patterns: [
    token,
    interfaceHeritage, // before expression or extends will look like type name
    interfaceBody, // before expression or { will match model expression
    expression, // enough to match name and type parameters
  ],
};

const importStatement: BeginEndRule = {
  key: "import-statement",
  scope: meta,
  begin: "\\b(import)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
  },
  end: universalEnd,
  patterns: [token],
};

const usingStatement: BeginEndRule = {
  key: "using-statement",
  scope: meta,
  begin: "\\b(using)\\b",
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
  },
  end: universalEnd,
  patterns: [token, identifierExpression],
};

const decoratorDeclarationStatement: BeginEndRule = {
  key: "decorator-declaration-statement",
  scope: meta,
  begin: `(?:(extern)\\s+)?\\b(dec)\\b\\s+(${identifier})`,
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
    "2": { scope: "keyword.other.tsp" },
    "3": { scope: "entity.name.function.tsp" },
  },
  end: universalEnd,
  patterns: [token, operationParameters],
};

const functionDeclarationStatement: BeginEndRule = {
  key: "function-declaration-statement",
  scope: meta,
  begin: `(?:(extern)\\s+)?\\b(fn)\\b\\s+(${identifier})`,
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
    "2": { scope: "keyword.other.tsp" },
    "3": { scope: "entity.name.function.tsp" },
  },
  end: universalEnd,
  patterns: [token, operationParameters, typeAnnotation],
};

const projectionParameter: BeginEndRule = {
  key: "projection-parameter",
  scope: meta,
  begin: `(${identifier})`,
  beginCaptures: {
    "1": { scope: "variable.name.tsp" },
  },
  end: `(?=\\))|${universalEnd}`,
  patterns: [],
};

const projectionParameters: BeginEndRule = {
  key: "projection-parameters",
  scope: meta,
  begin: "\\(",
  beginCaptures: {
    "0": { scope: "punctuation.parenthesis.open.tsp" },
  },
  end: "\\)",
  endCaptures: {
    "0": { scope: "punctuation.parenthesis.close.tsp" },
  },
  patterns: [token, projectionParameter],
};

const projectionExpression: IncludeRule = {
  key: "projection-expression",
  patterns: [
    /* placeholder filled later due to cycle*/
  ],
};

const projectionBody: BeginEndRule = {
  key: "projection-body",
  scope: meta,
  begin: "\\{",
  beginCaptures: {
    "0": { scope: "punctuation.curlybrace.open.tsp" },
  },
  end: "\\}",
  endCaptures: {
    "0": { scope: "punctuation.curlybrace.close.tsp" },
  },
  patterns: [projectionExpression, punctuationSemicolon],
};

const ifExpression: BeginEndRule = {
  key: "if-expression",
  scope: meta,
  begin: `\\b(if)\\b`,
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
  },
  end: `((?<=\\})|${universalEnd})`,
  patterns: [projectionExpression, projectionBody],
};

const elseIfExpression: BeginEndRule = {
  key: "else-if-expression",
  scope: meta,
  begin: `\\b(else)\\s+(if)\\b`,
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
    "2": { scope: "keyword.other.tsp" },
  },
  end: `((?<=\\})|${universalEnd})`,
  patterns: [projectionExpression, projectionBody],
};

const elseExpression: BeginEndRule = {
  key: "else-expression",
  scope: meta,
  begin: `\\b(else)\\b`,
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
  },
  end: `((?<=\\})|${universalEnd})`,
  patterns: [projectionExpression, projectionBody],
};

const functionCall: BeginEndRule = {
  key: "function-call",
  scope: meta,
  begin: `(${identifier})\\s*(\\()`,
  beginCaptures: {
    "1": { scope: "entity.name.function.tsp" },
    "2": { scope: "punctuation.parenthesis.open.tsp" },
  },
  end: `\\)`,
  endCaptures: {
    "0": { scope: "punctuation.parenthesis.close.tsp" },
  },
  patterns: [expression],
};

projectionExpression.patterns = [elseIfExpression, ifExpression, elseExpression, functionCall];

const projection: BeginEndRule = {
  key: "projection",
  scope: meta,
  begin: "(from|to)",
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
  },
  end: `((?<=\\})|${universalEnd})`,
  patterns: [projectionParameters, projectionBody],
};

const projectionStatementBody: BeginEndRule = {
  key: "projection-statement-body",
  scope: meta,
  begin: "\\{",
  beginCaptures: {
    "0": { scope: "punctuation.curlybrace.open.tsp" },
  },
  end: "\\}",
  endCaptures: {
    "0": { scope: "punctuation.curlybrace.close.tsp" },
  },
  patterns: [projection],
};

const projectionStatement: BeginEndRule = {
  key: "projection-statement",
  scope: meta,
  begin: `\\b(projection)\\b\\s+(${identifier})(#)(${identifier})`,
  beginCaptures: {
    "1": { scope: "keyword.other.tsp" },
    "2": { scope: "keyword.other.tsp" },
    "3": { scope: "keyword.operator.selector.tsp" },
    "4": { scope: "variable.name.tsp" },
  },
  end: `((?<=\\})|${universalEnd})`,
  patterns: [projectionStatementBody],
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
  valueOfExpression,
  typeArguments,
  tupleExpression,
  modelExpression,
  identifierExpression,
];

statement.patterns = [
  token,
  directive,
  augmentDecoratorStatement,
  decorator,
  modelStatement,
  scalarStatement,
  unionStatement,
  interfaceStatement,
  enumStatement,
  aliasStatement,
  namespaceStatement,
  operationStatement,
  importStatement,
  usingStatement,
  decoratorDeclarationStatement,
  functionDeclarationStatement,
  projectionStatement,
  punctuationSemicolon,
];

const grammar: Grammar = {
  $schema: tm.schema,
  name: "TypeSpec",
  scopeName: "source.tsp",
  fileTypes: [".tsp"],
  patterns: [statement],
};

export async function main() {
  const plist = await tm.emitPList(grammar, {
    errorSourceFilePath: resolve("./src/tmlanguage.ts"),
  });
  await mkdir("./dist", { recursive: true });
  await writeFile("./dist/typespec.tmLanguage", plist);
}
