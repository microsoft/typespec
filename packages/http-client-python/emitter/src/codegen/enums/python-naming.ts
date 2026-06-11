// -------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for
// license information.
// --------------------------------------------------------------------------

/**
 * TypeScript re-implementation of the enum-related naming rules that the Python
 * generator (`pygen`) applies during its preprocess stage. These rules must stay
 * in sync with `generator/pygen/preprocess` so the TS-rendered `_enums.py` matches
 * what pygen would have produced.
 */

// Mirrors `_always_reserved` in pygen/preprocess/python_mappings.py
const ALWAYS_RESERVED = new Set<string>([
  "and",
  "as",
  "assert",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "exec",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
  "async",
  "await",
  "int",
  "keys",
  "items",
  "values",
  "popitem",
  "clear",
  "update",
  "setdefault",
  "pop",
  "get",
  "copy",
  "as_dict",
  "datetime",
]);

// Reserved words for the ENUM_CLASS pad type (pygen RESERVED_WORDS[PadType.ENUM_CLASS]).
const ENUM_CLASS_RESERVED = new Set<string>(["enum", ...ALWAYS_RESERVED]);

// PadType.ENUM_CLASS value used as the suffix when padding (pygen python_mappings.py).
const ENUM_CLASS_PAD = "Enum";

/**
 * Replaces characters that are not valid in a Python identifier with `_`,
 * keeping ASCII letters, digits, and underscore.
 *
 * pygen's equivalent (`pad_special_chars`) uses `re.sub(r"[^A-z0-9_]", ...)`,
 * whose `A-z` range also happens to preserve the punctuation between `Z` and
 * `a` (`[ \ ] ^ _ \``). TypeSpec identifiers (e.g. `myEnum`) only contain
 * letters, digits, and underscore, so those characters never occur here and
 * the output matches pygen for every real input.
 */
export function padSpecialChars(name: string): string {
  return name.replace(/[^A-Za-z0-9_]/g, "_");
}

/**
 * Mirrors `PreProcessPlugin.pad_reserved_words(name, PadType.ENUM_CLASS, ...)`
 * followed by the `name[0].upper() + name[1:]` capitalization done in
 * `update_types`.
 */
export function enumClassName(name: string): string {
  if (!name) {
    return name;
  }
  let padded = padSpecialChars(name);
  const prefix = padded[0] === "_" ? "_" : "";
  if (padded[0] === "_") {
    padded = padded.slice(1);
  }
  let result: string;
  if (ENUM_CLASS_RESERVED.has(padded.toLowerCase())) {
    result = prefix + padded + ENUM_CLASS_PAD;
  } else {
    result = prefix + padded;
  }
  return result.length > 0 ? result[0].toUpperCase() + result.slice(1) : result;
}

/**
 * Mirrors the enum value name handling in `update_types`: upper-case the name and
 * prefix `ENUM_` when it would otherwise start with a digit.
 */
export function enumValueName(name: string): string {
  let upper = name.toUpperCase();
  if (upper.length > 0 && upper[0] >= "0" && upper[0] <= "9") {
    upper = "ENUM_" + upper;
  }
  return upper;
}
