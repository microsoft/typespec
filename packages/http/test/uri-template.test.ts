import { describe, expect, it } from "vitest";
import { parseUriTemplate } from "../src/uri-template.js";

it("no parameter", () => {
  expect(parseUriTemplate("/foo").parameters).toEqual([]);
});

it("simple parameters", () => {
  expect(parseUriTemplate("/foo/{one}/bar/baz/{two}").parameters).toEqual([
    { name: "one" },
    { name: "two" },
  ]);
});

describe("operators", () => {
  it.each(["+", "#", ".", "/", ";", "?", "&"])("%s", (operator) => {
    expect(parseUriTemplate(`/foo/{${operator}one}`).parameters).toEqual([
      { name: "one", operator },
    ]);
  });
});

it("define explode parameter", () => {
  expect(parseUriTemplate("/foo/{one*}").parameters).toEqual([
    { name: "one", modifier: { type: "explode" } },
  ]);
});

it("define prefix parameter", () => {
  expect(parseUriTemplate("/foo/{one:3}").parameters).toEqual([
    { name: "one", modifier: { type: "prefix", value: 3 } },
  ]);
});
