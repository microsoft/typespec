import { describe, expect, it } from "vitest";
import { capitalize } from "../src/casing/index.js";

describe("capitalize", () => {
  it("should capitalize the first letter of a string", () => {
    expect(capitalize("hello world")).toEqual("Hello world");
  });

  it("should return an empty string when input is empty", () => {
    expect(capitalize("")).toEqual("");
  });

  it("should handle single-character strings", () => {
    expect(capitalize("a")).toEqual("A");
  });
});
