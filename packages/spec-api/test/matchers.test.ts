import { describe, expect, it } from "vitest";
import { isMatcher, matchValues, match, MockValueMatcher } from "../src/matchers.js";
import { expandDyns, json } from "../src/response-utils.js";
import { ResolverConfig } from "../src/types.js";

describe("isMatcher", () => {
  it("should return true for a matcher", () => {
    expect(isMatcher(match.dateTime("2022-08-26T18:38:00.000Z"))).toBe(true);
  });

  it("should return false for plain values", () => {
    expect(isMatcher("hello")).toBe(false);
    expect(isMatcher(42)).toBe(false);
    expect(isMatcher(null)).toBe(false);
    expect(isMatcher(undefined)).toBe(false);
    expect(isMatcher({ a: 1 })).toBe(false);
    expect(isMatcher([1, 2])).toBe(false);
  });
});

describe("matchValues", () => {
  describe("plain values (same as deepEqual)", () => {
    it("should match identical primitives", () => {
      expect(matchValues("hello", "hello")).toBe(true);
      expect(matchValues(42, 42)).toBe(true);
      expect(matchValues(true, true)).toBe(true);
      expect(matchValues(null, null)).toBe(true);
    });

    it("should not match different primitives", () => {
      expect(matchValues("hello", "world")).toBe(false);
      expect(matchValues(42, 43)).toBe(false);
      expect(matchValues(true, false)).toBe(false);
      expect(matchValues(null, undefined)).toBe(false);
    });

    it("should not match different types", () => {
      expect(matchValues("42", 42)).toBe(false);
      expect(matchValues(0, false)).toBe(false);
      expect(matchValues("", null)).toBe(false);
    });

    it("should match identical objects", () => {
      expect(matchValues({ a: 1, b: "two" }, { a: 1, b: "two" })).toBe(true);
    });

    it("should not match objects with different keys", () => {
      expect(matchValues({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(matchValues({ a: 1, b: 2 }, { a: 1 })).toBe(false);
    });

    it("should match identical arrays", () => {
      expect(matchValues([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it("should not match arrays of different lengths", () => {
      expect(matchValues([1, 2], [1, 2, 3])).toBe(false);
    });

    it("should match nested objects", () => {
      expect(matchValues({ a: { b: [1, 2] } }, { a: { b: [1, 2] } })).toBe(true);
    });

    it("should not match nested objects with differences", () => {
      expect(matchValues({ a: { b: [1, 2] } }, { a: { b: [1, 3] } })).toBe(false);
    });
  });

  describe("with matchers", () => {
    it("should delegate to matcher.check() in top-level position", () => {
      const matcher: MockValueMatcher = {
        [Symbol.for("SpectorMatcher")]: true as const,
        check: (actual) => actual === "matched",
        toJSON: () => "raw",
        toString: () => "custom",
      };
      expect(matchValues("matched", matcher)).toBe(true);
      expect(matchValues("not-matched", matcher)).toBe(false);
    });

    it("should handle matchers nested in objects", () => {
      const expected = {
        name: "test",
        timestamp: match.dateTime("2022-08-26T18:38:00.000Z"),
      };
      expect(matchValues({ name: "test", timestamp: "2022-08-26T18:38:00Z" }, expected)).toBe(true);
    });

    it("should handle matchers nested in arrays", () => {
      const expected = [match.dateTime("2022-08-26T18:38:00.000Z"), "plain"];
      expect(matchValues(["2022-08-26T18:38:00Z", "plain"], expected)).toBe(true);
    });

    it("should handle deeply nested matchers", () => {
      const expected = {
        data: {
          items: [{ created: match.dateTime("2022-08-26T18:38:00.000Z"), name: "item1" }],
        },
      };
      const actual = {
        data: {
          items: [{ created: "2022-08-26T18:38:00.0000000Z", name: "item1" }],
        },
      };
      expect(matchValues(actual, expected)).toBe(true);
    });
  });
});

describe("match.dateTime", () => {
  it("should throw for invalid datetime", () => {
    expect(() => match.dateTime("not-a-date")).toThrow("invalid datetime value");
  });

  describe("check()", () => {
    const matcher = match.dateTime("2022-08-26T18:38:00.000Z");

    it("should match exact same string", () => {
      expect(matcher.check("2022-08-26T18:38:00.000Z")).toBe(true);
    });

    it("should match without fractional seconds", () => {
      expect(matcher.check("2022-08-26T18:38:00Z")).toBe(true);
    });

    it("should match with extra precision", () => {
      expect(matcher.check("2022-08-26T18:38:00.0000000Z")).toBe(true);
    });

    it("should match with different fractional precision", () => {
      expect(matcher.check("2022-08-26T18:38:00.00Z")).toBe(true);
    });

    it("should not match different time", () => {
      expect(matcher.check("2022-08-26T18:39:00.000Z")).toBe(false);
    });

    it("should not match non-string values", () => {
      expect(matcher.check(12345)).toBe(false);
      expect(matcher.check(null)).toBe(false);
      expect(matcher.check(undefined)).toBe(false);
    });

    it("should not match invalid datetime strings", () => {
      expect(matcher.check("not-a-date")).toBe(false);
    });
  });

  describe("toJSON()", () => {
    it("should return the original value", () => {
      expect(match.dateTime("2022-08-26T18:38:00.000Z").toJSON()).toBe(
        "2022-08-26T18:38:00.000Z",
      );
    });

    it("should serialize correctly in JSON.stringify", () => {
      const obj = { value: match.dateTime("2022-08-26T18:38:00.000Z") };
      expect(JSON.stringify(obj)).toBe('{"value":"2022-08-26T18:38:00.000Z"}');
    });
  });

  describe("toString()", () => {
    it("should return a descriptive string", () => {
      expect(match.dateTime("2022-08-26T18:38:00.000Z").toString()).toBe(
        "match.dateTime(2022-08-26T18:38:00.000Z)",
      );
    });
  });
});

describe("integration with expandDyns", () => {
  const config: ResolverConfig = { baseUrl: "http://localhost:3000" };

  it("should preserve matchers through expandDyns", () => {
    const content = { value: match.dateTime("2022-08-26T18:38:00.000Z") };
    const expanded = expandDyns(content, config);
    expect(isMatcher(expanded.value)).toBe(true);
  });

  it("should preserve matchers in arrays through expandDyns", () => {
    const content = { items: [match.dateTime("2022-08-26T18:38:00.000Z")] };
    const expanded = expandDyns(content, config);
    expect(isMatcher(expanded.items[0])).toBe(true);
  });
});

describe("integration with json() Resolver", () => {
  const config: ResolverConfig = { baseUrl: "http://localhost:3000" };

  it("should serialize matchers to their raw value via serialize()", () => {
    const body = json({ value: match.dateTime("2022-08-26T18:38:00.000Z") });
    const raw = (body.rawContent as any).serialize(config);
    expect(raw).toBe('{"value":"2022-08-26T18:38:00.000Z"}');
  });

  it("should preserve matchers via resolve()", () => {
    const body = json({ value: match.dateTime("2022-08-26T18:38:00.000Z") });
    const resolved = (body.rawContent as any).resolve(config) as Record<string, unknown>;
    expect(isMatcher(resolved.value)).toBe(true);
  });
});
