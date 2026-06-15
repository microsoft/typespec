import { describe, expect, it } from "vitest";
import { match } from "../../src/matchers/index.js";
import { expectFail, expectPass } from "./matcher-test-utils.js";

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
      expectPass(matcher.check("2022-08-26T18:38:00.000Z"));
    });

    it("should match without fractional seconds", () => {
      expectPass(matcher.check("2022-08-26T18:38:00Z"));
    });

    it("should match with extra precision", () => {
      expectPass(matcher.check("2022-08-26T18:38:00.0000000Z"));
    });

    it("should match with 1 fractional digit", () => {
      expectPass(matcher.check("2022-08-26T18:38:00.0Z"));
    });

    it("should match with 2 fractional digits", () => {
      expectPass(matcher.check("2022-08-26T18:38:00.00Z"));
    });

    it("should match with +00:00 offset instead of Z", () => {
      expectPass(matcher.check("2022-08-26T18:38:00.000+00:00"));
    });

    it("should match equivalent time in a different timezone offset", () => {
      expectPass(matcher.check("2022-08-26T14:38:00.000-04:00"));
    });

    it("should reject RFC 7231 format even if same point in time", () => {
      expectFail(matcher.check("Fri, 26 Aug 2022 18:38:00 GMT"), "rfc3339 format");
    });

    it("should not match different time", () => {
      expectFail(matcher.check("2022-08-26T18:39:00.000Z"), "timestamps differ");
    });

    it("should not match off by one second", () => {
      expectFail(matcher.check("2022-08-26T18:38:01.000Z"), "timestamps differ");
    });

    it("should not match different date same time", () => {
      expectFail(matcher.check("2022-08-27T18:38:00.000Z"), "timestamps differ");
    });

    it("should not match non-string values", () => {
      expectFail(matcher.check(12345), "expected a string but got number");
      expectFail(matcher.check(null), "expected a string but got object");
      expectFail(matcher.check(undefined), "expected a string but got undefined");
      expectFail(matcher.check(true), "expected a string but got boolean");
      expectFail(matcher.check({}), "expected a string but got object");
      expectFail(matcher.check([]), "expected a string but got object");
    });

    it("should not match empty string", () => {
      expectFail(matcher.check(""), "rfc3339 format");
    });

    it("should not match invalid datetime strings", () => {
      expectFail(matcher.check("not-a-date"), "rfc3339 format");
    });
  });

  describe("with non-zero milliseconds", () => {
    const matcher = match.dateTime.rfc3339("2022-08-26T18:38:00.123Z");

    it("should match exact milliseconds", () => {
      expectPass(matcher.check("2022-08-26T18:38:00.123Z"));
    });

    it("should match with trailing zeros", () => {
      expectPass(matcher.check("2022-08-26T18:38:00.1230000Z"));
    });

    it("should not match truncated milliseconds", () => {
      expectFail(matcher.check("2022-08-26T18:38:00Z"), "timestamps differ");
    });

    it("should not match different milliseconds", () => {
      expectFail(matcher.check("2022-08-26T18:38:00.124Z"), "timestamps differ");
    });
  });

  describe("with midnight edge case", () => {
    const matcher = match.dateTime.rfc3339("2022-08-26T00:00:00.000Z");

    it("should match midnight", () => {
      expectPass(matcher.check("2022-08-26T00:00:00Z"));
    });

    it("should match midnight with offset expressing previous day", () => {
      expectPass(matcher.check("2022-08-25T20:00:00-04:00"));
    });
  });

  describe("serialize()", () => {
    it("should return the original value", () => {
      expect(match.dateTime.rfc3339("2022-08-26T18:38:00.000Z").serialize()).toBe(
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
      expectPass(matcher.check("Fri, 26 Aug 2022 14:38:00 GMT"));
    });

    it("should reject RFC 3339 format even if same point in time", () => {
      expectFail(matcher.check("2022-08-26T14:38:00.000Z"), "rfc7231 format");
    });

    it("should not match different time", () => {
      expectFail(matcher.check("Fri, 26 Aug 2022 14:39:00 GMT"), "timestamps differ");
    });

    it("should not match non-string values", () => {
      expectFail(matcher.check(12345), "expected a string but got number");
      expectFail(matcher.check(null), "expected a string but got object");
    });
  });

  describe("serialize()", () => {
    it("should preserve RFC 7231 format", () => {
      expect(match.dateTime.rfc7231("Fri, 26 Aug 2022 14:38:00 GMT").serialize()).toBe(
        "Fri, 26 Aug 2022 14:38:00 GMT",
      );
    });
  });
});

describe("match.dateTime.utcRfc3339()", () => {
  it("should throw for invalid datetime", () => {
    expect(() => match.dateTime.utcRfc3339("not-a-date")).toThrow("invalid datetime value");
  });

  it("should throw for empty string", () => {
    expect(() => match.dateTime.utcRfc3339("")).toThrow("invalid datetime value");
  });

  describe("check()", () => {
    const matcher = match.dateTime.utcRfc3339("2022-08-26T18:38:00.000Z");

    it("should match exact same string", () => {
      expectPass(matcher.check("2022-08-26T18:38:00.000Z"));
    });

    it("should match without fractional seconds", () => {
      expectPass(matcher.check("2022-08-26T18:38:00Z"));
    });

    it("should match with extra precision", () => {
      expectPass(matcher.check("2022-08-26T18:38:00.0000000Z"));
    });

    it("should reject +00:00 offset even though equivalent to Z", () => {
      expectFail(matcher.check("2022-08-26T18:38:00.000+00:00"), "utcRfc3339 format");
    });

    it("should reject timezone offset", () => {
      expectFail(matcher.check("2022-08-26T14:38:00.000-04:00"), "utcRfc3339 format");
    });

    it("should reject positive timezone offset", () => {
      expectFail(matcher.check("2022-08-26T20:38:00.000+02:00"), "utcRfc3339 format");
    });

    it("should reject RFC 7231 format", () => {
      expectFail(matcher.check("Fri, 26 Aug 2022 18:38:00 GMT"), "utcRfc3339 format");
    });

    it("should not match different time", () => {
      expectFail(matcher.check("2022-08-26T18:39:00.000Z"), "timestamps differ");
    });

    it("should not match non-string values", () => {
      expectFail(matcher.check(12345), "expected a string but got number");
      expectFail(matcher.check(null), "expected a string but got object");
    });
  });

  describe("serialize()", () => {
    it("should return the original value", () => {
      expect(match.dateTime.utcRfc3339("2022-08-26T18:38:00.000Z").serialize()).toBe(
        "2022-08-26T18:38:00.000Z",
      );
    });
  });

  describe("toString()", () => {
    it("should include utcRfc3339 in toString()", () => {
      expect(match.dateTime.utcRfc3339("2022-08-26T18:38:00.000Z").toString()).toBe(
        "match.dateTime.utcRfc3339(2022-08-26T18:38:00.000Z)",
      );
    });
  });
});
