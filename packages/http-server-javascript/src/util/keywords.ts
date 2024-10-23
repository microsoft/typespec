// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

const KEYWORDS_CONTEXTUAL = [
  "any",
  "boolean",
  "constructor",
  "declare",
  "get",
  "module",
  "require",
  "number",
  "set",
  "string",
];

const KEYWORDS_STRICT = [
  "as",
  "implements",
  "interface",
  "let",
  "package",
  "private",
  "protected",
  "public",
  "static",
  "yield",
  "symbol",
  "type",
  "from",
  "of",
];

const KEYWORDS_RESERVED = [
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "function",
  "if",
  "import",
  "in",
  "instanceof",
  "new",
  "null",
  "return",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "typeof",
  "var",
  "void",
  "while",
  "with",

  "namespace",
  "async",
  "await",
  "module",
  "delete",
];

/**
 * A set of reserved keywords that should not be used as identifiers.
 */
export const KEYWORDS = new Set([...KEYWORDS_STRICT, ...KEYWORDS_RESERVED, ...KEYWORDS_CONTEXTUAL]);

/**
 * Makes a name safe to use as an identifier by prefixing it with an underscore
 * if it would conflict with a keyword.
 */
export function keywordSafe(name: string): string {
  return KEYWORDS.has(name) ? `_${name}` : name;
}
