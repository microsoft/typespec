import { describe, expect, it } from "vitest";
import {
  err,
  isMatcher,
  type MatchResult,
  matchValues,
  MockValueMatcher,
  ok,
} from "../src/match-engine.js";
import { match } from "../src/matchers/index.js";
import { expandDyns, json } from "../src/response-utils.js";
import { ResolverConfig } from "../src/types.js";

describe("isMatcher", () => {
  it("should return true for a matcher", () => {
    expect(isMatcher(match.dateTime.rfc3339("2022-08-26T18:38:00.000Z"))).toBe(true);
  });

  it("should return true for localUrl matchers", () => {
    expect(isMatcher(match.localUrl("/path"))).toBe(true);
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

function expectPass(result: MatchResult) {
  expect(result).toEqual({ pass: true });
}

function expectFail(result: MatchResult, messagePattern?: string | RegExp) {
  expect(result.pass).toBe(false);
  if (!result.pass && messagePattern) {
    if (typeof messagePattern === "string") {
      expect(result.message).toContain(messagePattern);
    } else {
      expect(result.message).toMatch(messagePattern);
    }
  }
}

describe("matchValues", () => {
  describe("plain values (same as deepEqual)", () => {
    it("should match identical primitives", () => {
      expectPass(matchValues("hello", "hello"));
      expectPass(matchValues(42, 42));
      expectPass(matchValues(true, true));
      expectPass(matchValues(null, null));
    });

    it("should not match different primitives", () => {
      expectFail(matchValues("hello", "world"));
      expectFail(matchValues(42, 43));
      expectFail(matchValues(true, false));
      expectFail(matchValues(null, undefined));
    });

    it("should not match different types", () => {
      expectFail(matchValues("42", 42), "Type mismatch");
      expectFail(matchValues(0, false), "Type mismatch");
      expectFail(matchValues("", null));
    });

    it("should match identical objects", () => {
      expectPass(matchValues({ a: 1, b: "two" }, { a: 1, b: "two" }));
    });

    it("should not match objects with different keys", () => {
      expectFail(matchValues({ a: 1 }, { a: 1, b: 2 }), "Key count mismatch");
      expectFail(matchValues({ a: 1, b: 2 }, { a: 1 }), "Key count mismatch");
    });

    it("should match identical arrays", () => {
      expectPass(matchValues([1, 2, 3], [1, 2, 3]));
    });

    it("should not match arrays of different lengths", () => {
      expectFail(matchValues([1, 2], [1, 2, 3]), "Array length mismatch");
    });

    it("should match nested objects", () => {
      expectPass(matchValues({ a: { b: [1, 2] } }, { a: { b: [1, 2] } }));
    });

    it("should not match nested objects with differences", () => {
      expectFail(matchValues({ a: { b: [1, 2] } }, { a: { b: [1, 3] } }));
    });
  });

  describe("error messages include path", () => {
    it("should include path for nested object mismatch", () => {
      const result = matchValues({ a: { b: "wrong" } }, { a: { b: "right" } });
      expectFail(result, "at $.a.b:");
    });

    it("should include path for array element mismatch", () => {
      const result = matchValues([1, 2, "wrong"], [1, 2, "right"]);
      expectFail(result, "at $[2]:");
    });

    it("should include path for deeply nested mismatch", () => {
      const result = matchValues(
        { data: { items: [{ name: "wrong" }] } },
        { data: { items: [{ name: "right" }] } },
      );
      expectFail(result, "at $.data.items[0].name:");
    });

    it("should report missing keys", () => {
      const result = matchValues({ a: 1 }, { a: 1, b: 2 });
      expectFail(result, "missing: [b]");
    });

    it("should report extra keys", () => {
      const result = matchValues({ a: 1, b: 2 }, { a: 1 });
      expectFail(result, "extra: [b]");
    });
  });

  describe("with matchers", () => {
    it("should delegate to matcher.check() in top-level position", () => {
      const matcher: MockValueMatcher = {
        [Symbol.for("SpectorMatcher")]: true as const,
        check: (actual: any) =>
          actual === "matched" ? ok() : err(`expected "matched" but got "${actual}"`),
        serialize: () => "raw",
        toJSON: () => "raw",
      } as any;
      expectPass(matchValues("matched", matcher));
      expectFail(matchValues("not-matched", matcher));
    });

    it("should handle matchers nested in objects", () => {
      const expected = {
        name: "test",
        timestamp: match.dateTime.rfc3339("2022-08-26T18:38:00.000Z"),
      };
      expectPass(matchValues({ name: "test", timestamp: "2022-08-26T18:38:00Z" }, expected));
    });

    it("should handle matchers nested in arrays", () => {
      const expected = [match.dateTime.rfc3339("2022-08-26T18:38:00.000Z"), "plain"];
      expectPass(matchValues(["2022-08-26T18:38:00Z", "plain"], expected));
    });

    it("should handle deeply nested matchers", () => {
      const expected = {
        data: {
          items: [{ created: match.dateTime.rfc3339("2022-08-26T18:38:00.000Z"), name: "item1" }],
        },
      };
      const actual = {
        data: {
          items: [{ created: "2022-08-26T18:38:00.0000000Z", name: "item1" }],
        },
      };
      expectPass(matchValues(actual, expected));
    });

    it("should include path in matcher failure message", () => {
      const expected = {
        data: { timestamp: match.dateTime.rfc3339("2022-08-26T18:38:00.000Z") },
      };
      const actual = { data: { timestamp: "not-rfc3339" } };
      const result = matchValues(actual, expected);
      expectFail(result, "at $.data.timestamp:");
      expectFail(result, "rfc3339 format");
    });

    it("should use localUrl matchers with config for exact URL check", () => {
      const config: ResolverConfig = { baseUrl: "http://localhost:3000" };
      const expected = { link: match.localUrl("/next-page") };
      expectPass(matchValues({ link: "http://localhost:3000/next-page" }, expected, "$", config));
      expectFail(
        matchValues({ link: "http://localhost:3000/other-page" }, expected, "$", config),
        "match.localUrl",
      );
    });
  });
});

describe("integration with expandDyns", () => {
  const config: ResolverConfig = { baseUrl: "http://localhost:3000" };

  it("should resolve matchers to their plain values", () => {
    const content = { value: match.dateTime.rfc3339("2022-08-26T18:38:00.000Z") };
    const expanded = expandDyns(content, config);
    expect(expanded.value).toBe("2022-08-26T18:38:00.000Z");
  });

  it("should resolve matchers in arrays to their plain values", () => {
    const content = { items: [match.dateTime.rfc3339("2022-08-26T18:38:00.000Z")] };
    const expanded = expandDyns(content, config);
    expect(expanded.items[0]).toBe("2022-08-26T18:38:00.000Z");
  });

  it("should resolve localUrl matchers to their full URL", () => {
    const content = { next: match.localUrl("/next-page") };
    const expanded = expandDyns(content, config);
    expect(expanded.next).toBe("http://localhost:3000/next-page");
  });

  it("should resolve all matchers to their plain values", () => {
    const content = {
      timestamp: match.dateTime.rfc3339("2022-08-26T18:38:00.000Z"),
      next: match.localUrl("/next-page"),
    };
    const expanded = expandDyns(content, config);
    expect(expanded.timestamp).toBe("2022-08-26T18:38:00.000Z");
    expect(expanded.next).toBe("http://localhost:3000/next-page");
  });
});

describe("integration with json() Resolver", () => {
  const config: ResolverConfig = { baseUrl: "http://localhost:3000" };

  it("should serialize matchers to their raw value via serialize()", () => {
    const body = json({ value: match.dateTime.rfc3339("2022-08-26T18:38:00.000Z") });
    const raw = (body.rawContent as any).serialize(config);
    expect(raw).toBe('{"value":"2022-08-26T18:38:00.000Z"}');
  });

  it("should preserve matchers via resolve()", () => {
    const body = json({ value: match.dateTime.rfc3339("2022-08-26T18:38:00.000Z") });
    const resolved = (body.rawContent as any).resolve(config) as Record<string, unknown>;
    expect(isMatcher(resolved.value)).toBe(true);
  });

  it("should serialize localUrl matchers to their full URL via serialize()", () => {
    const body = json({ next: match.localUrl("/items/page2") });
    const raw = (body.rawContent as any).serialize(config);
    expect(raw).toBe('{"next":"http://localhost:3000/items/page2"}');
  });

  it("should preserve localUrl matchers via resolve()", () => {
    const body = json({ next: match.localUrl("/items/page2") });
    const resolved = (body.rawContent as any).resolve(config) as Record<string, unknown>;
    expect(isMatcher(resolved.next)).toBe(true);
    expectPass((resolved.next as any).check("http://localhost:3000/items/page2", config));
  });
});
