import { expect, it } from "vitest";
import { $ } from "../../src/typekit/index.js";
import { getTypes } from "./utils.js";

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
