import { describe, expect, it } from "vitest";
import { isMatcher } from "../../src/match-engine.js";
import { match } from "../../src/matchers/index.js";
import { expandDyns } from "../../src/response-utils.js";
import { ResolverConfig } from "../../src/types.js";
import { expectFail, expectPass } from "./matcher-test-utils.js";

describe("match.localUrl()", () => {
  it("should be identified by isMatcher", () => {
    expect(isMatcher(match.localUrl("/some/path"))).toBe(true);
  });

  describe("unresolved check() — loose path-suffix validation", () => {
    const matcher = match.localUrl("/payload/pageable/next-page");

    it("should match any URL ending with the path", () => {
      expectPass(matcher.check("http://localhost:3000/payload/pageable/next-page"));
      expectPass(matcher.check("https://example.com/payload/pageable/next-page"));
    });

    it("should not match a different path", () => {
      expectFail(
        matcher.check("http://localhost:3000/payload/pageable/other-page"),
        'ending with "/payload/pageable/next-page"',
      );
    });

    it("should not match non-string values", () => {
      expectFail(matcher.check(42), "expected a string but got number");
      expectFail(matcher.check(null), "expected a string but got object");
      expectFail(matcher.check(undefined), "expected a string but got undefined");
    });
  });

  describe("unresolved serialize", () => {
    it("serialize should return the path", () => {
      expect(match.localUrl("/some/path").serialize()).toBe("/some/path");
    });
  });

  describe("resolved matcher", () => {
    const config: ResolverConfig = { baseUrl: "http://localhost:3000" };
    const resolved = match.localUrl("/payload/pageable/next-page").resolve(config);

    describe("check()", () => {
      it("should match the exact full URL (baseUrl + path)", () => {
        expectPass(resolved.check("http://localhost:3000/payload/pageable/next-page"));
      });

      it("should not match a different base URL", () => {
        expectFail(
          resolved.check("http://localhost:4000/payload/pageable/next-page"),
          "match.localUrl",
        );
      });

      it("should not match a different path", () => {
        expectFail(
          resolved.check("http://localhost:3000/payload/pageable/other-page"),
          "match.localUrl",
        );
      });

      it("should not match a partial URL", () => {
        expectFail(resolved.check("/payload/pageable/next-page"), "match.localUrl");
      });

      it("should not match non-string values", () => {
        expectFail(resolved.check(42), "expected a string but got number");
        expectFail(resolved.check(null), "expected a string but got object");
      });
    });

    describe("serialize()", () => {
      it("should return the full URL", () => {
        expect(resolved.serialize()).toBe("http://localhost:3000/payload/pageable/next-page");
      });

      it("should serialize correctly in JSON.stringify", () => {
        const obj = { nextLink: resolved };
        expect(JSON.stringify(obj)).toBe(
          '{"nextLink":"http://localhost:3000/payload/pageable/next-page"}',
        );
      });
    });
    describe("toString()", () => {
      it("should return a descriptive string", () => {
        expect(resolved.toString()).toBe('match.localUrl("/payload/pageable/next-page")');
      });
    });
  });

  describe("resolution with different base URLs", () => {
    const unresolved = match.localUrl("/api/items");

    it("should resolve with localhost", () => {
      const resolved = unresolved.resolve({ baseUrl: "http://localhost:3000" });
      expectPass(resolved.check("http://localhost:3000/api/items"));
    });

    it("should resolve with https URL", () => {
      const resolved = unresolved.resolve({ baseUrl: "https://example.com" });
      expectPass(resolved.check("https://example.com/api/items"));
    });

    it("should resolve with URL including port", () => {
      const resolved = unresolved.resolve({ baseUrl: "http://127.0.0.1:8080" });
      expectPass(resolved.check("http://127.0.0.1:8080/api/items"));
    });
  });

  describe("integration with expandDyns", () => {
    const config: ResolverConfig = { baseUrl: "http://localhost:3000" };

    it("should resolve baseUrl matchers to their full URL", () => {
      const content = { next: match.localUrl("/next-page") };
      const expanded = expandDyns(content, config);
      expect(expanded.next).toBe("http://localhost:3000/next-page");
    });

    it("should resolve baseUrl matchers nested in objects", () => {
      const content = {
        data: {
          nextLink: match.localUrl("/items/page2"),
        },
      };
      const expanded = expandDyns(content, config);
      expect(expanded.data.nextLink).toBe("http://localhost:3000/items/page2");
    });

    it("should resolve baseUrl matchers in arrays", () => {
      const content = { links: [match.localUrl("/page1"), match.localUrl("/page2")] };
      const expanded = expandDyns(content, config);
      expect(expanded.links[0]).toBe("http://localhost:3000/page1");
      expect(expanded.links[1]).toBe("http://localhost:3000/page2");
    });

    it("should serialize resolved matcher in JSON.stringify", () => {
      const content = { next: match.localUrl("/next-page") };
      const expanded = expandDyns(content, config);
      expect(JSON.stringify(expanded)).toBe('{"next":"http://localhost:3000/next-page"}');
    });
  });
});
