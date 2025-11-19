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

  it("should validate successfully when numeric strings match exactly", () => {
    const requestExt = { query: { value: "150.0" } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(requestExpectation.containsQueryParam("value", "150.0")).toBe(undefined);
  });

  it("should validate successfully when numeric strings are numerically equal", () => {
    const requestExt = { query: { value: "150" } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(requestExpectation.containsQueryParam("value", "150.0")).toBe(undefined);
  });

  it("should validate successfully when numeric strings with trailing zero match", () => {
    const requestExt = { query: { value: "210000.0" } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(requestExpectation.containsQueryParam("value", "210000")).toBe(undefined);
  });

  it("should throw validation error when numeric values are different", () => {
    const requestExt = { query: { value: "150" } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(() => requestExpectation.containsQueryParam("value", "151")).toThrow();
  });

  it("should throw validation error when non-numeric strings don't match", () => {
    const requestExt = { query: { value: "hello" } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(() => requestExpectation.containsQueryParam("value", "world")).toThrow();
  });
});

describe("containsHeader()", () => {
  it("should validate successfully when header matches exactly", () => {
    const requestExt = { headers: { duration: "P40D" } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(requestExpectation.containsHeader("duration", "P40D")).toBe(undefined);
  });

  it("should validate successfully when numeric header strings match exactly", () => {
    const requestExt = { headers: { duration: "150.0" } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(requestExpectation.containsHeader("duration", "150.0")).toBe(undefined);
  });

  it("should validate successfully when numeric header strings are numerically equal", () => {
    const requestExt = { headers: { duration: "150" } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(requestExpectation.containsHeader("duration", "150.0")).toBe(undefined);
  });

  it("should validate successfully when numeric header strings with trailing zero match", () => {
    const requestExt = { headers: { duration: "210000.0" } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(requestExpectation.containsHeader("duration", "210000")).toBe(undefined);
  });

  it("should throw validation error when numeric header values are different", () => {
    const requestExt = { headers: { duration: "150" } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(() => requestExpectation.containsHeader("duration", "151")).toThrow();
  });

  it("should throw validation error when non-numeric header strings don't match", () => {
    const requestExt = { headers: { duration: "P40D" } } as unknown as RequestExt;
    const requestExpectation = new RequestExpectation(requestExt);
    expect(() => requestExpectation.containsHeader("duration", "P50D")).toThrow();
  });
});
