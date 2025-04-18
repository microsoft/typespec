import { expect, it } from "vitest";
import { $ } from "../../../src/experimental/typekit/index.js";
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
});
