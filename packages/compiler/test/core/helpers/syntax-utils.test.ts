import { expect, it } from "vitest";
import { printIdentifier } from "../../../src/index.js";

it.each([
  ["foo", "foo"],
  ["foo-bar", "`foo-bar`"],
  ["9test", "`9test`"],
  ["foo bar", "`foo bar`"],
  ["foo\nbar", "`foo\\nbar`"],
])("%s -> %s", (a, b) => {
  expect(printIdentifier(a)).toEqual(b);
});
