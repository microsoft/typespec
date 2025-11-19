import { describe, expect, it } from "vitest";
import { RequestExpectation } from "../src/expectation.js";
import { RequestExt } from "../src/types.js";

describe("containsQueryParam()", () => {
  it("should validate successfully with correct input of multi collection", () => {
    const requestExt = { query: { letter: ["a", "b", "c"] } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(requestExpectation.containsQueryParam("letter", ["a", "b", "c"], "multi")).toBe(
      undefined,
    );
  });

  it("should validate successfully with correct input of csv collection with common not encoded", () => {
    const requestExt = { query: { letter: "a,b,c" } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(requestExpectation.containsQueryParam("letter", ["a", "b", "c"], "csv")).toBe(undefined);
  });

  it("should validate successfully with correct input of csv collection with common encoded", () => {
    const requestExt = { query: { letter: "a%2Cb%2Cc" } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(requestExpectation.containsQueryParam("letter", ["a", "b", "c"], "csv")).toBe(undefined);
  });

  it("should validate successfully with correct input of csv collection with common encoded and space", () => {
    const requestExt = { query: { letter: "a%2Cb%2Cc%20" } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(requestExpectation.containsQueryParam("letter", ["a", "b", "c "], "csv")).toBe(
      undefined,
    );
  });

  it("should throw validation error with wrong input of multi collection", () => {
    const requestExt = { query: { letter: ["a", "b", "d"] } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(() =>
      requestExpectation.containsQueryParam("letter", ["a", "b", "c"], "multi"),
    ).toThrow();
  });

  it("should throw validation error with wrong input of csv collection with common not encoded", () => {
    const requestExt = { query: { letter: "a,b,d" } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(() => requestExpectation.containsQueryParam("letter", ["a", "b", "c"], "csv")).toThrow();
  });

  it("should validate successfully with correct input", () => {
    const requestExt = { query: { letter: "[a, b, c]" } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(requestExpectation.containsQueryParam("letter", "[a, b, c]")).toBe(undefined);
  });
});
