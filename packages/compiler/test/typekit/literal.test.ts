import { describe, expect, it } from "vitest";
import { t } from "../../src/testing/marked-template.js";
import { $ } from "../../src/typekit/index.js";
import { Tester } from "../tester.js";
import { getTypes } from "./utils.js";

describe("created literal have object equality", async () => {
  it.each([
    ["string", "value"],
    ["number", 123],
    ["boolean", true],
  ])("%s", async (_, value) => {
    const { program, s } = await Tester.compile(t.code`
    alias ${t.type("s")} = ${JSON.stringify(value)};  
  `);
    expect(s).toBe($(program).literal.create(value));
    expect($(program).literal.create(value)).toBe($(program).literal.create(value));
  });
});

it("can check for a string", async () => {
  const {
    s,
    b,
    context: { program },
  } = await getTypes(
    `
    alias s = "hi";
    alias b = true;
    alias n = 12;
    `,
    ["s", "b", "n"],
  );

  expect($(program).literal.isString(s)).toBe(true);
  expect($(program).literal.isString(b)).toBe(false);
  expect($(program).literal.isString($(program).value.create("value"))).toBe(false);
});

it("can check for a boolean", async () => {
  const {
    s,
    b,
    context: { program },
  } = await getTypes(
    `
    alias s = "hi";
    alias b = true;
    `,
    ["s", "b"],
  );

  expect($(program).literal.isBoolean(b)).toBe(true);
  expect($(program).literal.isBoolean(s)).toBe(false);
  expect($(program).literal.isBoolean($(program).value.create(true))).toBe(false);
});

it("can check for a numeric", async () => {
  const {
    s,
    n,
    context: { program },
  } = await getTypes(
    `
    alias s = "hi";
    alias n = 12;
    `,
    ["s", "n"],
  );

  expect($(program).literal.isNumeric(n)).toBe(true);
  expect($(program).literal.isNumeric(s)).toBe(false);
  expect($(program).literal.isNumeric($(program).value.create(123))).toBe(false);
});

it("can check for a literal", async () => {
  const {
    s,
    b,
    n,
    context: { program },
  } = await getTypes(
    `
    alias s = "hi";
    alias b = true;
    alias n = 12;
    `,
    ["s", "b", "n"],
  );

  expect($(program).literal.is(s)).toBe(true);
  expect($(program).literal.is(b)).toBe(true);
  expect($(program).literal.is(n)).toBe(true);
  expect($(program).literal.is($(program).value.create("value"))).toBe(false);
});
