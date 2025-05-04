import { assert, expect, it } from "vitest";
import { Scalar } from "../../src/index.js";
import { $ } from "../../src/typekit/index.js";
import { getTypes } from "./utils.js";

it("can check for a string", async () => {
  const {
    foo,
    bar,
    context: { program },
  } = await getTypes(
    `
    alias foo = string;
    alias bar = boolean;
    `,
    ["foo", "bar"],
  );

  expect($(program).scalar.isString(foo)).toBe(true);
  expect($(program).scalar.isString(bar)).toBe(false);
  expect($(program).scalar.isString($(program).value.create("value"))).toBe(false);
});

it("can check for a numeric", async () => {
  const {
    foo,
    bar,
    context: { program },
  } = await getTypes(
    `
    alias foo = numeric;
    alias bar = int32;
    `,
    ["foo", "bar"],
  );

  expect($(program).scalar.isNumeric(foo)).toBe(true);
  expect($(program).scalar.isNumeric(bar)).toBe(false);
});

it("can get the base scalar", async () => {
  const {
    foo,
    bar,
    context: { program },
  } = await getTypes(
    `
    scalar foo extends string;
    scalar bar;
    `,
    ["foo", "bar"],
  );

  const baseFoo = $(program).scalar.getStdBase(foo as Scalar);
  const baseBar = $(program).scalar.getStdBase(bar as Scalar);
  expect($(program).scalar.isString(baseFoo!)).toBe(true);
  expect(baseBar).toBe(null);
});

it("can get a scalar encoding", async () => {
  const {
    myDateTime,
    context: { program },
  } = await getTypes(
    `
    @encode("rfc7231")
    scalar myDateTime extends offsetDateTime;
    `,
    ["myDateTime"],
  );

  const info = $(program).scalar.getEncoding(myDateTime as Scalar)!;
  expect(info.encoding).toBe("rfc7231");
  assert($(program).scalar.isString(info.type));
});
