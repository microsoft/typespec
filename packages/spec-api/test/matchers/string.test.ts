import { describe, expect, it } from "vitest";
import { isMatcher } from "../../src/match-engine.js";
import { match } from "../../src/matchers/index.js";
import { expectFail, expectPass } from "./matcher-test-utils.js";

it("should be identified by isMatcher", () => {
  expect(isMatcher(match.string.caseInsensitive("true"))).toBe(true);
});

describe("check()", () => {
  it("should match lower-case true", () => {
    expectPass(match.string.caseInsensitive("true").check("true"));
  });

  it("should match upper-case true", () => {
    expectPass(match.string.caseInsensitive("true").check("TRUE"));
  });

  it("should match mixed-case false", () => {
    expectPass(match.string.caseInsensitive("false").check("FaLsE"));
  });

  it("should reject a different string value", () => {
    expectFail(
      match.string.caseInsensitive("true").check("false"),
      'expected case-insensitive "true"',
    );
  });

  it("should reject non-string values", () => {
    expectFail(
      match.string.caseInsensitive("true").check(true),
      "expected a string but got boolean",
    );
    expectFail(
      match.string.caseInsensitive("false").check(null),
      "expected a string but got object",
    );
  });
});

describe("serialize()", () => {
  it("should serialize the original value", () => {
    expect(match.string.caseInsensitive("TrUe").serialize()).toBe("TrUe");
    expect(match.string.caseInsensitive("FALSE").serialize()).toBe("FALSE");
  });
});

describe("toString()", () => {
  it("should return a descriptive string", () => {
    expect(match.string.caseInsensitive("true").toString()).toBe(
      'match.string.caseInsensitive("true")',
    );
  });
});
