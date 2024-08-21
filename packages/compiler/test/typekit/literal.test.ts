import { expect, it } from "vitest";
import { $ } from "../../src/typekit/define-kit.js";
import "../../src/typekit/kits/literal.js";

import { getTypes } from "./utils.js";

it("can check for a string", async () => {
  const { s, b, n } = await getTypes(
    `
    alias s = "hi";
    alias b = true;
    alias n = 12;
    `,
    ["s", "b", "n"]
  );

  expect($.literal.isString(s)).toBe(true);
  expect($.literal.isString(b)).toBe(false);
});
