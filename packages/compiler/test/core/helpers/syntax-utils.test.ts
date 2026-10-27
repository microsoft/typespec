import { expect, it } from "vitest";
import {
  printIdentifier,
  printMemberExpressionPath,
} from "../../../src/core/helpers/syntax-utils.js";

it.each([
  ["foo", "foo"],
  ["foo-bar", "`foo-bar`"],
  ["9test", "`9test`"],
  ["foo bar", "`foo bar`"],
  ["foo\nbar", "`foo\\nbar`"],
])("%s -> %s", (a, b) => {
  expect(printIdentifier(a)).toEqual(b);
});

// Modifier keywords require backtick escaping in default (disallow-reserved) context
it.each([
  ["internal", "`internal`"],
  ["extern", "`extern`"],
])("%s -> %s (disallow-reserved)", (a, b) => {
  expect(printIdentifier(a)).toEqual(b);
});

// Modifier keywords do not require backtick escaping in allow-reserved context
it.each([
  ["internal", "internal"],
  ["extern", "extern"],
])("%s -> %s (allow-reserved)", (a, b) => {
  expect(printIdentifier(a, "allow-reserved")).toEqual(b);
});

it.each([
  ["T", ".", "model", "T.`model`"],
  ["T.`model`", "::", "type", "T.`model`::type"],
  ["T::`model`", ".", "x", "T::`model`.x"],
])("%s%s%s -> %s", (base, selector, id, expected) => {
  expect(printMemberExpressionPath(base, selector as "." | "::", id)).toEqual(expected);
});
