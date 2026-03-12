import { describe, expect, it } from "vitest";
import { RequestExpectation } from "../src/expectation.js";
import { RequestExt } from "../src/types.js";

describe("coercedBodyEquals()", () => {
  function createRequest(body: unknown): RequestExt {
    return {
      body,
      rawBody: JSON.stringify(body),
    } as unknown as RequestExt;
  }

  it("should match when actual and expected datetimes are identical", () => {
    const req = createRequest({ value: "2022-08-26T18:38:00.000Z" });
    const expectation = new RequestExpectation(req);
    expect(() =>
      expectation.coercedBodyEquals({ value: "2022-08-26T18:38:00.000Z" }),
    ).not.toThrow();
  });

  it("should match when actual has no fractional seconds and expected has .000", () => {
    const req = createRequest({ value: "2022-08-26T18:38:00Z" });
    const expectation = new RequestExpectation(req);
    expect(() =>
      expectation.coercedBodyEquals({ value: "2022-08-26T18:38:00.000Z" }),
    ).not.toThrow();
  });

  it("should match when actual has .000 and expected has no fractional seconds", () => {
    const req = createRequest({ value: "2022-08-26T18:38:00.000Z" });
    const expectation = new RequestExpectation(req);
    expect(() => expectation.coercedBodyEquals({ value: "2022-08-26T18:38:00Z" })).not.toThrow();
  });

  it("should match when actual has 7 fractional digits (C# style) and expected has 3", () => {
    const req = createRequest({ value: "2022-08-26T18:38:00.0000000Z" });
    const expectation = new RequestExpectation(req);
    expect(() =>
      expectation.coercedBodyEquals({ value: "2022-08-26T18:38:00.000Z" }),
    ).not.toThrow();
  });

  it("should match when actual has 1 fractional digit and expected has 3", () => {
    const req = createRequest({ value: "2022-08-26T18:38:00.0Z" });
    const expectation = new RequestExpectation(req);
    expect(() =>
      expectation.coercedBodyEquals({ value: "2022-08-26T18:38:00.000Z" }),
    ).not.toThrow();
  });

  it("should match when actual has +00:00 offset and expected has Z", () => {
    const req = createRequest({ value: "2022-08-26T18:38:00.000+00:00" });
    const expectation = new RequestExpectation(req);
    expect(() =>
      expectation.coercedBodyEquals({ value: "2022-08-26T18:38:00.000Z" }),
    ).not.toThrow();
  });

  it("should match when actual has -00:00 offset and expected has Z", () => {
    const req = createRequest({ value: "2022-08-26T18:38:00-00:00" });
    const expectation = new RequestExpectation(req);
    expect(() => expectation.coercedBodyEquals({ value: "2022-08-26T18:38:00Z" })).not.toThrow();
  });

  it("should match nested datetime values with different precisions", () => {
    const req = createRequest({
      start: "2022-08-26T18:38:00.0000000Z",
      end: "2023-01-15T10:00:00.0Z",
    });
    const expectation = new RequestExpectation(req);
    expect(() =>
      expectation.coercedBodyEquals({
        start: "2022-08-26T18:38:00.000Z",
        end: "2023-01-15T10:00:00Z",
      }),
    ).not.toThrow();
  });

  it("should match array of datetime values with different precisions", () => {
    const req = createRequest({
      values: ["2022-08-26T18:38:00.0000000Z", "2023-01-15T10:00:00.0Z"],
    });
    const expectation = new RequestExpectation(req);
    expect(() =>
      expectation.coercedBodyEquals({
        values: ["2022-08-26T18:38:00.000Z", "2023-01-15T10:00:00Z"],
      }),
    ).not.toThrow();
  });

  it("should not match when datetime values represent different times", () => {
    const req = createRequest({ value: "2022-08-26T18:38:01Z" });
    const expectation = new RequestExpectation(req);
    expect(() => expectation.coercedBodyEquals({ value: "2022-08-26T18:38:00Z" })).toThrow();
  });

  it("should match non-datetime values without coercion", () => {
    const req = createRequest({ name: "test", count: 42 });
    const expectation = new RequestExpectation(req);
    expect(() => expectation.coercedBodyEquals({ name: "test", count: 42 })).not.toThrow();
  });

  it("should handle null expected body when request body is empty", () => {
    const req = { rawBody: "" } as unknown as RequestExt;
    const expectation = new RequestExpectation(req);
    expect(() => expectation.coercedBodyEquals(null)).not.toThrow();
  });

  it("should handle undefined expected body when request body is empty", () => {
    const req = { rawBody: undefined } as unknown as RequestExt;
    const expectation = new RequestExpectation(req);
    expect(() => expectation.coercedBodyEquals(undefined)).not.toThrow();
  });

  it("should throw when expected is null but request body is not empty", () => {
    const req = createRequest({ value: "something" });
    const expectation = new RequestExpectation(req);
    expect(() => expectation.coercedBodyEquals(null)).toThrow();
  });

  it("should match when actual has 8+ fractional digits", () => {
    const req = createRequest({ value: "2022-08-26T18:38:00.000000000Z" });
    const expectation = new RequestExpectation(req);
    expect(() => expectation.coercedBodyEquals({ value: "2022-08-26T18:38:00Z" })).not.toThrow();
  });
});
