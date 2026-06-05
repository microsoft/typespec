import { describe, expect, it } from "vitest";
import { isMatcher } from "../../src/match-engine.js";
import { match } from "../../src/matchers/index.js";
import { expectFail, expectPass } from "./matcher-test-utils.js";

describe("match.boolean.caseInsensitiveString()", () => {
  it("should be identified by isMatcher", () => {
    expect(isMatcher(match.boolean.caseInsensitiveString(true))).toBe(true);
  });

  describe("check()", () => {
    it("should match lower-case true", () => {
      expectPass(match.boolean.caseInsensitiveString(true).check("true"));
    });

    it("should match upper-case true", () => {
      expectPass(match.boolean.caseInsensitiveString(true).check("TRUE"));
    });

    it("should match mixed-case false", () => {
      expectPass(match.boolean.caseInsensitiveString(false).check("FaLsE"));
    });

    it("should reject the opposite boolean value", () => {
      expectFail(match.boolean.caseInsensitiveString(true).check("false"), 'expected case-insensitive "true"');
    });

    it("should reject non-string values", () => {
      expectFail(
        match.boolean.caseInsensitiveString(true).check(true),
        "expected a string but got boolean",
      );
      expectFail(
        match.boolean.caseInsensitiveString(false).check(null),
        "expected a string but got object",
      );
    });
  });

  describe("serialize()", () => {
    it("should serialize to canonical lowercase value", () => {
      expect(match.boolean.caseInsensitiveString(true).serialize()).toBe("true");
      expect(match.boolean.caseInsensitiveString(false).serialize()).toBe("false");
    });
  });

  describe("toString()", () => {
    it("should return a descriptive string", () => {
      expect(match.boolean.caseInsensitiveString(true).toString()).toBe(
        "match.boolean.caseInsensitiveString(true)",
      );
    });
  });
});
