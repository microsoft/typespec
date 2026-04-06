import { describe, expect, it } from "vitest";
import { isMatcher, type MatcherConfig } from "../../src/match-engine.js";
import { match } from "../../src/matchers/index.js";
import { expectFail, expectPass } from "./matcher-test-utils.js";

const config: MatcherConfig = { baseUrl: "http://localhost:3000" };

describe("match.localUrl()", () => {
  it("should be identified by isMatcher", () => {
    expect(isMatcher(match.localUrl("/some/path"))).toBe(true);
  });

  describe("check()", () => {
    const matcher = match.localUrl("/payload/pageable/next-page");

    it("should match exact full URL", () => {
      expectPass(matcher.check("http://localhost:3000/payload/pageable/next-page", config));
    });

    it("should not match a different base URL", () => {
      expectFail(
        matcher.check("http://localhost:4000/payload/pageable/next-page", config),
        "match.localUrl",
      );
    });

    it("should not match a different path", () => {
      expectFail(
        matcher.check("http://localhost:3000/payload/pageable/other-page", config),
        "match.localUrl",
      );
    });

    it("should not match non-string values", () => {
      expectFail(matcher.check(42, config), "expected a string but got number");
      expectFail(matcher.check(null, config), "expected a string but got object");
      expectFail(matcher.check(undefined, config), "expected a string but got undefined");
    });
  });

  describe("serialize()", () => {
    it("should return the full URL with config", () => {
      expect(match.localUrl("/some/path").serialize(config)).toBe(
        "http://localhost:3000/some/path",
      );
    });

    it("should serialize correctly in JSON.stringify", () => {
      const obj = { nextLink: match.localUrl("/some/path") };
      // toJSON() uses empty config, so just the path
      expect(JSON.stringify(obj)).toBe('{"nextLink":"/some/path"}');
    });
  });

  describe("resolution with different base URLs", () => {
    const matcher = match.localUrl("/api/items");

    it("should resolve with localhost", () => {
      expectPass(
        matcher.check("http://localhost:3000/api/items", { baseUrl: "http://localhost:3000" }),
      );
    });

    it("should resolve with https URL", () => {
      expectPass(
        matcher.check("https://example.com/api/items", { baseUrl: "https://example.com" }),
      );
    });

    it("should resolve with URL including port", () => {
      expectPass(
        matcher.check("http://127.0.0.1:8080/api/items", { baseUrl: "http://127.0.0.1:8080" }),
      );
    });
  });

  describe("toString()", () => {
    it("should return a descriptive string", () => {
      expect(match.localUrl("/some/path").toString()).toBe('match.localUrl("/some/path")');
    });
  });
});
