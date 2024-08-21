import { assert, expect, it } from "vitest";
import { Scalar } from "../../src/core/types.js";
import { $ } from "../../src/typekit/index.js";
import { getTypes } from "./utils.js";

it("can check for a string", async () => {
  const { foo, bar } = await getTypes(
    `
    alias foo = string;
    alias bar = boolean;
    `,
    ["foo", "bar"]
  );

  expect($.scalar.isString(foo)).toBe(true);
  expect($.scalar.isString(bar)).toBe(false);
});

it("can check for a numeric", async () => {
  const { foo, bar } = await getTypes(
    `
    alias foo = numeric;
    alias bar = int32;
    `,
    ["foo", "bar"]
  );

  expect($.scalar.isNumeric(foo)).toBe(true);
  expect($.scalar.isNumeric(bar)).toBe(false);
});

it("can get the base scalar", async () => {
  const { foo, bar } = await getTypes(
    `
    scalar foo extends string;
    scalar bar;
    `,
    ["foo", "bar"]
  );

  const baseFoo = $.scalar.getStdBase(foo as Scalar);
  const baseBar = $.scalar.getStdBase(bar as Scalar);
  expect($.scalar.isString(baseFoo!)).toBe(true);
  expect(baseBar).toBe(null);
});

it("can get a scalar encoding", async () => {
  const { myDateTime } = await getTypes(
    `
    @encode("rfc7231")
    scalar myDateTime extends offsetDateTime;
    `,
    ["myDateTime"]
  );

  const info = $.scalar.getEncoding(myDateTime as Scalar)!;
  expect(info.encoding).toBe("rfc7231");
  assert($.scalar.isString(info.type));
});
