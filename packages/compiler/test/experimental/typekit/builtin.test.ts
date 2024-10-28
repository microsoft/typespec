import { expect, it } from "vitest";
import { $ } from "../../../src/experimental/typekit/index.js";

it("can get a builtin type", async () => {
  const stringType = $.builtin.string;
  expect(stringType).toBeDefined();
  expect(stringType.name).toBe("string");
});
