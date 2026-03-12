import { describe, expect, it } from "vitest";
import { match } from "../../src/match.js";

describe("match.dateTime.rfc3339()", () => {
  it("should throw for invalid datetime", () => {
    expect(() => match.dateTime.rfc3339("not-a-date")).toThrow("invalid datetime value");
  });

  it("should throw for empty string", () => {
    expect(() => match.dateTime.rfc3339("")).toThrow("invalid datetime value");
  });

  describe("check()", () => {
    const matcher = match.dateTime.rfc3339("2022-08-26T18:38:00.000Z");

    it("should match exact same string", () => {
      expect(matcher.check("2022-08-26T18:38:00.000Z")).toBe(true);
    });

    it("should match without fractional seconds", () => {
      expect(matcher.check("2022-08-26T18:38:00Z")).toBe(true);
    });

    it("should match with extra precision", () => {
      expect(matcher.check("2022-08-26T18:38:00.0000000Z")).toBe(true);
    });

    it("should match with 1 fractional digit", () => {
      expect(matcher.check("2022-08-26T18:38:00.0Z")).toBe(true);
    });

    it("should match with 2 fractional digits", () => {
      expect(matcher.check("2022-08-26T18:38:00.00Z")).toBe(true);
    });

    it("should match with +00:00 offset instead of Z", () => {
      expect(matcher.check("2022-08-26T18:38:00.000+00:00")).toBe(true);
    });

    it("should match equivalent time in a different timezone offset", () => {
      expect(matcher.check("2022-08-26T14:38:00.000-04:00")).toBe(true);
    });

    it("should reject RFC 7231 format even if same point in time", () => {
      expect(matcher.check("Fri, 26 Aug 2022 18:38:00 GMT")).toBe(false);
    });

    it("should not match different time", () => {
      expect(matcher.check("2022-08-26T18:39:00.000Z")).toBe(false);
    });

    it("should not match off by one second", () => {
      expect(matcher.check("2022-08-26T18:38:01.000Z")).toBe(false);
    });

    it("should not match different date same time", () => {
      expect(matcher.check("2022-08-27T18:38:00.000Z")).toBe(false);
    });

    it("should not match non-string values", () => {
      expect(matcher.check(12345)).toBe(false);
      expect(matcher.check(null)).toBe(false);
      expect(matcher.check(undefined)).toBe(false);
      expect(matcher.check(true)).toBe(false);
      expect(matcher.check({})).toBe(false);
      expect(matcher.check([])).toBe(false);
    });

    it("should not match empty string", () => {
      expect(matcher.check("")).toBe(false);
    });

    it("should not match invalid datetime strings", () => {
      expect(matcher.check("not-a-date")).toBe(false);
    });
  });

  describe("with non-zero milliseconds", () => {
    const matcher = match.dateTime.rfc3339("2022-08-26T18:38:00.123Z");

    it("should match exact milliseconds", () => {
      expect(matcher.check("2022-08-26T18:38:00.123Z")).toBe(true);
    });

    it("should match with trailing zeros", () => {
      expect(matcher.check("2022-08-26T18:38:00.1230000Z")).toBe(true);
    });

    it("should not match truncated milliseconds", () => {
      expect(matcher.check("2022-08-26T18:38:00Z")).toBe(false);
    });

    it("should not match different milliseconds", () => {
      expect(matcher.check("2022-08-26T18:38:00.124Z")).toBe(false);
    });
  });

  describe("with midnight edge case", () => {
    const matcher = match.dateTime.rfc3339("2022-08-26T00:00:00.000Z");

    it("should match midnight", () => {
      expect(matcher.check("2022-08-26T00:00:00Z")).toBe(true);
    });

    it("should match midnight with offset expressing previous day", () => {
      expect(matcher.check("2022-08-25T20:00:00-04:00")).toBe(true);
    });
  });

  describe("toJSON()", () => {
    it("should return the original value", () => {
      expect(match.dateTime.rfc3339("2022-08-26T18:38:00.000Z").toJSON()).toBe(
        "2022-08-26T18:38:00.000Z",
      );
    });

    it("should serialize correctly in JSON.stringify", () => {
      const obj = { value: match.dateTime.rfc3339("2022-08-26T18:38:00.000Z") };
      expect(JSON.stringify(obj)).toBe('{"value":"2022-08-26T18:38:00.000Z"}');
    });
  });

  describe("toString()", () => {
    it("should include rfc3339 in toString()", () => {
      expect(match.dateTime.rfc3339("2022-08-26T18:38:00.000Z").toString()).toBe(
        "match.dateTime.rfc3339(2022-08-26T18:38:00.000Z)",
      );
    });
  });
});

describe("match.dateTime.rfc7231()", () => {
  it("should throw for invalid datetime", () => {
    expect(() => match.dateTime.rfc7231("not-a-date")).toThrow("invalid datetime value");
  });

  describe("check()", () => {
    const matcher = match.dateTime.rfc7231("Fri, 26 Aug 2022 14:38:00 GMT");

    it("should match exact same string", () => {
      expect(matcher.check("Fri, 26 Aug 2022 14:38:00 GMT")).toBe(true);
    });

    it("should reject RFC 3339 format even if same point in time", () => {
      expect(matcher.check("2022-08-26T14:38:00.000Z")).toBe(false);
    });

    it("should not match different time", () => {
      expect(matcher.check("Fri, 26 Aug 2022 14:39:00 GMT")).toBe(false);
    });

    it("should not match non-string values", () => {
      expect(matcher.check(12345)).toBe(false);
      expect(matcher.check(null)).toBe(false);
    });
  });

  describe("toJSON()", () => {
    it("should preserve RFC 7231 format", () => {
      expect(match.dateTime.rfc7231("Fri, 26 Aug 2022 14:38:00 GMT").toJSON()).toBe(
        "Fri, 26 Aug 2022 14:38:00 GMT",
      );
    });
  });

  describe("toString()", () => {
    it("should include rfc7231 in toString()", () => {
      expect(match.dateTime.rfc7231("Fri, 26 Aug 2022 14:38:00 GMT").toString()).toBe(
        "match.dateTime.rfc7231(Fri, 26 Aug 2022 14:38:00 GMT)",
      );
    });
  });
});
