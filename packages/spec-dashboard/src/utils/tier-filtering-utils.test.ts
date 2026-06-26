import { describe, expect, it } from "vitest";
import { classifyScenario, compileTierConfig, type TierConfig } from "./tier-filtering-utils.js";

describe("compileTierConfig", () => {
  it("should compile exact matches", () => {
    const config: TierConfig = {
      default: "tier1",
      tiers: {
        tier1: ["Scenario.A", "Scenario.B"],
        tier2: ["Scenario.C"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(compiled.exact.get("Scenario.A")).toBe("tier1");
    expect(compiled.exact.get("Scenario.B")).toBe("tier1");
    expect(compiled.exact.get("Scenario.C")).toBe("tier2");
    expect(compiled.defaultTier).toBe("tier1");
    expect(compiled.patterns).toHaveLength(0);
  });

  it("should compile wildcard patterns into regexes", () => {
    const config: TierConfig = {
      default: "tier1",
      tiers: {
        tier1: ["Type.*"],
        tier2: ["Authentication.*"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(compiled.patterns).toHaveLength(2);
    expect(compiled.patterns[0].tier).toBe("tier1");
    expect(compiled.patterns[0].regex).toBeInstanceOf(RegExp);
    expect(compiled.patterns[1].tier).toBe("tier2");
    expect(compiled.exact.size).toBe(0);
  });

  it("should handle mixed exact and wildcard patterns", () => {
    const config: TierConfig = {
      default: "tier1",
      tiers: {
        tier1: ["Exact.Match", "Prefix.*"],
        tier2: ["Another.Exact"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(compiled.exact.size).toBe(2);
    expect(compiled.patterns).toHaveLength(1);
    expect(compiled.exact.get("Exact.Match")).toBe("tier1");
    expect(compiled.exact.get("Another.Exact")).toBe("tier2");
    expect(compiled.patterns[0].tier).toBe("tier1");
  });

  it("should escape regex special characters in patterns", () => {
    const config: TierConfig = {
      default: "tier1",
      tiers: {
        tier1: ["Test.With.Dots.*", "Test(With)Parens.*"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(compiled.patterns).toHaveLength(2);
    // Should match patterns with dots literally
    expect(compiled.patterns[0].regex.test("Test.With.Dots.Anything")).toBe(true);
    expect(compiled.patterns[0].regex.test("TestXWithXDots.Anything")).toBe(false);
    // Should match patterns with parens literally
    expect(compiled.patterns[1].regex.test("Test(With)Parens.Anything")).toBe(true);
  });

  it("should handle wildcards at the start of patterns", () => {
    const config: TierConfig = {
      default: "tier1",
      tiers: {
        tier1: ["*.Suffix"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(compiled.patterns).toHaveLength(1);
    expect(compiled.patterns[0].regex.test("Anything.Suffix")).toBe(true);
    expect(compiled.patterns[0].regex.test("Multiple.Parts.Suffix")).toBe(true);
    expect(compiled.patterns[0].regex.test(".Suffix")).toBe(true);
    expect(compiled.patterns[0].regex.test("Suffix")).toBe(false); // wildcard needs something before the dot
  });

  it("should handle wildcards in the middle of patterns", () => {
    const config: TierConfig = {
      default: "tier1",
      tiers: {
        tier1: ["Prefix.*.Suffix"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(compiled.patterns).toHaveLength(1);
    expect(compiled.patterns[0].regex.test("Prefix.Middle.Suffix")).toBe(true);
    expect(compiled.patterns[0].regex.test("Prefix.Multiple.Parts.Suffix")).toBe(true);
    expect(compiled.patterns[0].regex.test("Prefix..Suffix")).toBe(true); // dots are literal
    expect(compiled.patterns[0].regex.test("Prefix.Suffix")).toBe(false); // missing the middle part
  });

  it("should handle multiple wildcards in a pattern", () => {
    const config: TierConfig = {
      default: "tier1",
      tiers: {
        tier1: ["*.Array.*.get"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(compiled.patterns).toHaveLength(1);
    expect(compiled.patterns[0].regex.test("Type.Array.StringValue.get")).toBe(true);
    expect(compiled.patterns[0].regex.test(".Array..get")).toBe(true); // wildcards can match empty
    expect(compiled.patterns[0].regex.test("Prefix.Array.Middle.Suffix.get")).toBe(true);
  });

  it("should throw error if default tier is not in tiers", () => {
    const config: TierConfig = {
      default: "nonexistent",
      tiers: {
        tier1: ["Scenario.A"],
      },
    };

    expect(() => compileTierConfig(config)).toThrow(
      'Invalid tierConfig.default: "nonexistent" not found in tiers',
    );
  });

  it("should handle empty tier arrays", () => {
    const config: TierConfig = {
      default: "tier1",
      tiers: {
        tier1: [],
        tier2: ["Scenario.A"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(compiled.exact.size).toBe(1);
    expect(compiled.patterns).toHaveLength(0);
    expect(compiled.defaultTier).toBe("tier1");
  });
});

describe("classifyScenario", () => {
  it("should classify exact matches first", () => {
    const config: TierConfig = {
      default: "tier1",
      tiers: {
        tier1: ["Type.*"],
        tier2: ["Type.Array.StringValue"],
      },
    };

    const compiled = compileTierConfig(config);

    // Exact match should win over wildcard pattern
    expect(classifyScenario("Type.Array.StringValue", compiled)).toBe("tier2");
    // Wildcard should match others
    expect(classifyScenario("Type.Array.IntValue", compiled)).toBe("tier1");
  });

  it("should match prefix wildcards", () => {
    const config: TierConfig = {
      default: "default",
      tiers: {
        default: [],
        tier1: ["Type.*"],
        tier2: ["Authentication.*"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(classifyScenario("Type.Array.StringValue", compiled)).toBe("tier1");
    expect(classifyScenario("Type.Model.Property", compiled)).toBe("tier1");
    expect(classifyScenario("Authentication.ApiKey.Header", compiled)).toBe("tier2");
  });

  it("should match suffix wildcards", () => {
    const config: TierConfig = {
      default: "default",
      tiers: {
        default: [],
        tier1: ["*.get"],
        tier2: ["*.post"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(classifyScenario("Type.Array.get", compiled)).toBe("tier1");
    expect(classifyScenario("Authentication.ApiKey.get", compiled)).toBe("tier1");
    expect(classifyScenario("Type.Array.post", compiled)).toBe("tier2");
  });

  it("should match middle wildcards", () => {
    const config: TierConfig = {
      default: "default",
      tiers: {
        default: [],
        tier1: ["Type.*.Value"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(classifyScenario("Type.Array.Value", compiled)).toBe("tier1");
    expect(classifyScenario("Type.Model.Property.Value", compiled)).toBe("tier1");
    expect(classifyScenario("Type.Array.Other", compiled)).toBe("default");
  });

  it("should match multiple wildcards", () => {
    const config: TierConfig = {
      default: "default",
      tiers: {
        default: [],
        tier1: ["*.Array.*.get"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(classifyScenario("Type.Array.StringValue.get", compiled)).toBe("tier1");
    expect(classifyScenario("Encode.Array.BooleanValue.get", compiled)).toBe("tier1");
    expect(classifyScenario(".Array..get", compiled)).toBe("tier1"); // wildcards matching empty
    expect(classifyScenario("Type.Array.StringValue.post", compiled)).toBe("default");
  });

  it("should return first matching pattern", () => {
    const config: TierConfig = {
      default: "default",
      tiers: {
        default: [],
        tier1: ["Type.*"],
        tier2: ["Type.Array.*"],
      },
    };

    const compiled = compileTierConfig(config);

    // Both patterns would match, but tier1 is checked first
    expect(classifyScenario("Type.Array.StringValue", compiled)).toBe("tier1");
  });

  it("should return default tier when no patterns match", () => {
    const config: TierConfig = {
      default: "fallback",
      tiers: {
        fallback: [],
        tier1: ["Type.*"],
        tier2: ["Authentication.*"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(classifyScenario("Unknown.Scenario", compiled)).toBe("fallback");
    expect(classifyScenario("Random.Name", compiled)).toBe("fallback");
  });

  it("should handle scenarios with special regex characters", () => {
    const config: TierConfig = {
      default: "default",
      tiers: {
        default: [],
        tier1: ["Test.With.Dots.*"],
        tier2: ["Test(With)Parens.*"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(classifyScenario("Test.With.Dots.Scenario", compiled)).toBe("tier1");
    expect(classifyScenario("Test(With)Parens.Scenario", compiled)).toBe("tier2");
    // Should NOT match if dots are replaced with other chars
    expect(classifyScenario("TestXWithXDots.Scenario", compiled)).toBe("default");
  });

  it("should match empty string after wildcard", () => {
    const config: TierConfig = {
      default: "default",
      tiers: {
        default: [],
        tier1: ["Prefix.*"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(classifyScenario("Prefix.", compiled)).toBe("tier1");
    expect(classifyScenario("Prefix.Something", compiled)).toBe("tier1");
  });

  it("should require full match (anchored regex)", () => {
    const config: TierConfig = {
      default: "default",
      tiers: {
        default: [],
        tier1: ["Type.Array"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(classifyScenario("Type.Array", compiled)).toBe("tier1");
    // Should NOT match if there's more after
    expect(classifyScenario("Type.Array.StringValue", compiled)).toBe("default");
    // Should NOT match if there's more before
    expect(classifyScenario("Prefix.Type.Array", compiled)).toBe("default");
  });

  it("should handle complex real-world scenarios", () => {
    const config: TierConfig = {
      default: "tier3",
      tiers: {
        tier1: ["Type_*", "Authentication_ApiKey_*", "Authentication_Http_Basic_*"],
        tier2: ["Encode_*", "Parameters_*", "*_Array_*"],
        tier3: ["Advanced_*"],
      },
    };

    const compiled = compileTierConfig(config);

    // Tier 1 matches (checked first)
    expect(classifyScenario("Type_Model_Property", compiled)).toBe("tier1");
    expect(classifyScenario("Authentication_ApiKey_Header", compiled)).toBe("tier1");
    expect(classifyScenario("Authentication_Http_Basic_Valid", compiled)).toBe("tier1");

    // Tier 2 matches
    expect(classifyScenario("Encode_Bytes_Header", compiled)).toBe("tier2");
    expect(classifyScenario("Parameters_Query_Simple", compiled)).toBe("tier2");
    expect(classifyScenario("Foo_Array_StringValue", compiled)).toBe("tier2"); // *.Array.* matches

    // Tier 3 matches (default)
    expect(classifyScenario("Advanced_Feature_Complex", compiled)).toBe("tier3");
    expect(classifyScenario("Unknown_Scenario", compiled)).toBe("tier3");
  });

  it("should handle case-sensitive matching", () => {
    const config: TierConfig = {
      default: "default",
      tiers: {
        default: [],
        tier1: ["Type_*"],
      },
    };

    const compiled = compileTierConfig(config);

    expect(classifyScenario("Type_Array", compiled)).toBe("tier1");
    expect(classifyScenario("type_Array", compiled)).toBe("default");
    expect(classifyScenario("TYPE_Array", compiled)).toBe("default");
  });
});
