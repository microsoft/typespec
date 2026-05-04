import { describe, expect, it } from "vitest";
import { dyn, dynItem, expandDyns } from "../src/response-utils.js";

it("interpolate basic dyn", () => {
  const result = dyn`Hello ${dynItem("baseUrl")}/bar`({ baseUrl: "http://localhost:3000" });
  expect(result).toEqual("Hello http://localhost:3000/bar");
});

it("interpolate regular strings", () => {
  const result = dyn`Hello ${dynItem("baseUrl")}/bar ${"constant"} extra`({
    baseUrl: "http://localhost:3000",
  });
  expect(result).toEqual("Hello http://localhost:3000/bar constant extra");
});

describe("expandDyns", () => {
  it("expand in nested object", () => {
    const result = expandDyns(
      {
        val1: dyn`${dynItem("baseUrl")}/val1`,
        nested: { val2: dyn`${dynItem("baseUrl")}/val2` },
      },
      { baseUrl: "http://localhost:3000" },
    );
    expect(result).toEqual({
      nested: {
        val2: "http://localhost:3000/val2",
      },
      val1: "http://localhost:3000/val1",
    });
  });
});
