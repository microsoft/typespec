import { describe, expect, it } from "vitest";
import { compileValueType } from "./utils.js";

describe("without type it use the most precise type", () => {
  it.each([
    ["1", "Number"],
    [`"abc"`, "String"],
    [`true`, "Boolean"],
    [`#{foo: "abc"}`, "Model"],
    [`#["abc"]`, "Tuple"],
  ])("%s => %s", async (input, kind) => {
    const value = await compileValueType("a", `const a = ${input};`);
    expect(value.type.kind).toBe(kind);
  });
});
