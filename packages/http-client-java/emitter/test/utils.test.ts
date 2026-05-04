import { describe, expect, it } from "vitest";
import { scopeExplicitlyIncludeJava, scopeImplicitlyIncludeJava } from "../src/type-utils.js";
import {
  optionBoolean,
  pascalCase,
  removeClientSuffix,
  stringArrayContainsIgnoreCase,
} from "../src/utils.js";
import {
  isStableApiVersionString,
  isVersionEarlierThan,
  isVersionedByDate,
} from "../src/versioning-utils.js";

describe("utils", () => {
  it("pascalCase", () => {
    expect(pascalCase("foo")).toBe("Foo");
    expect(pascalCase("fooBar")).toBe("FooBar");
    expect(pascalCase("FooBar")).toBe("FooBar");
    expect(pascalCase("foo bar")).toBe("Foo bar");
  });

  it("stringArrayContainsIgnoreCase", () => {
    expect(stringArrayContainsIgnoreCase(["foo", "bar"], "foo")).toBe(true);
    expect(stringArrayContainsIgnoreCase(["foo", "bar"], "Bar")).toBe(true);
    expect(stringArrayContainsIgnoreCase(["foo", "bar"], "del")).toBe(false);
  });

  it("removeClientSuffix", () => {
    expect(removeClientSuffix("FooClient")).toBe("Foo");
    expect(removeClientSuffix("client")).toBe("client");
  });

  it("optionBoolean", () => {
    expect(optionBoolean("true")).toBe(true);
    expect(optionBoolean("false")).toBe(false);
    expect(optionBoolean("NA")).toBe(false);
    expect(optionBoolean(true)).toBe(true);
    expect(optionBoolean(false)).toBe(false);
    expect(optionBoolean(undefined)).toBe(undefined);
  });
});

describe("versioning-utils", () => {
  it("isStableApiVersion", () => {
    expect(isStableApiVersionString("2022-09-01")).toBe(true);
    expect(isStableApiVersionString("2023-12-01-preview")).toBe(false);
  });

  it("isVersionedByDate - valid date versions", () => {
    // Valid stable versions
    expect(isVersionedByDate("2024-01-15")).toBe(true);
    expect(isVersionedByDate("2023-12-31")).toBe(true);
    expect(isVersionedByDate("2025-06-01")).toBe(true);
    expect(isVersionedByDate("2022-02-28")).toBe(true);
    expect(isVersionedByDate("2020-02-29")).toBe(true); // leap year

    // Valid preview versions
    expect(isVersionedByDate("2024-01-15-preview")).toBe(true);
    expect(isVersionedByDate("2023-12-31-preview")).toBe(true);
    expect(isVersionedByDate("2025-06-01-preview")).toBe(true);

    // Edge cases for valid dates
    expect(isVersionedByDate("2024-01-01")).toBe(true);
    expect(isVersionedByDate("2024-12-31")).toBe(true);
  });

  it("isVersionedByDate - invalid date versions", () => {
    // Invalid format - single digit month/day
    expect(isVersionedByDate("2024-1-15")).toBe(false);
    expect(isVersionedByDate("2024-01-5")).toBe(false);
    expect(isVersionedByDate("2024-1-5")).toBe(false);

    // Invalid format - wrong year length
    expect(isVersionedByDate("24-01-15")).toBe(false);
    expect(isVersionedByDate("202-01-15")).toBe(false);
    expect(isVersionedByDate("20244-01-15")).toBe(false);

    // Invalid separators
    expect(isVersionedByDate("2024/01/15")).toBe(false);
    expect(isVersionedByDate("2024.01.15")).toBe(false);
    expect(isVersionedByDate("20240115")).toBe(false);

    // Invalid month values
    expect(isVersionedByDate("2024-00-15")).toBe(false);
    expect(isVersionedByDate("2024-13-15")).toBe(false);

    // Invalid day values
    expect(isVersionedByDate("2024-01-00")).toBe(false);
    expect(isVersionedByDate("2024-01-32")).toBe(false);

    // Invalid suffix
    expect(isVersionedByDate("2024-01-15-beta")).toBe(false);
    expect(isVersionedByDate("2024-01-15-alpha")).toBe(false);
    expect(isVersionedByDate("2024-01-15-rc")).toBe(false);
    expect(isVersionedByDate("2024-01-15-PREVIEW")).toBe(false); // case sensitive

    // Additional characters
    expect(isVersionedByDate("2024-01-15-preview-extra")).toBe(false);
    expect(isVersionedByDate("prefix-2024-01-15")).toBe(false);
    expect(isVersionedByDate("2024-01-15 ")).toBe(false); // trailing space
    expect(isVersionedByDate(" 2024-01-15")).toBe(false); // leading space

    // Empty or null values
    expect(isVersionedByDate("")).toBe(false);
    expect(isVersionedByDate(null as any)).toBe(false);
    expect(isVersionedByDate(undefined as any)).toBe(false);

    // Non-date formats
    expect(isVersionedByDate("v1.0.0")).toBe(false);
    expect(isVersionedByDate("1.2.3")).toBe(false);
    expect(isVersionedByDate("stable")).toBe(false);
    expect(isVersionedByDate("latest")).toBe(false);
  });

  it("isVersionEarlierThan - date comparisons", () => {
    // Year comparisons
    expect(isVersionEarlierThan("2023-01-01", "2024-01-01")).toBe(true);
    expect(isVersionEarlierThan("2024-01-01", "2023-01-01")).toBe(false);

    // Month comparisons (same year)
    expect(isVersionEarlierThan("2024-01-01", "2024-12-01")).toBe(true);
    expect(isVersionEarlierThan("2024-12-01", "2024-01-01")).toBe(false);
    expect(isVersionEarlierThan("2024-06-01", "2024-07-01")).toBe(true);

    // Day comparisons (same year and month)
    expect(isVersionEarlierThan("2024-01-01", "2024-01-31")).toBe(true);
    expect(isVersionEarlierThan("2024-01-31", "2024-01-01")).toBe(false);
    expect(isVersionEarlierThan("2024-01-15", "2024-01-16")).toBe(true);

    // Cross month/year boundaries
    expect(isVersionEarlierThan("2023-12-31", "2024-01-01")).toBe(true);
    expect(isVersionEarlierThan("2024-01-31", "2024-02-01")).toBe(true);
  });

  it("isVersionEarlierThan - preview vs stable", () => {
    // Same date: preview is earlier than stable
    expect(isVersionEarlierThan("2024-01-15-preview", "2024-01-15")).toBe(true);
    expect(isVersionEarlierThan("2024-01-15", "2024-01-15-preview")).toBe(false);

    // Different dates: date takes precedence over preview status
    expect(isVersionEarlierThan("2024-01-14-preview", "2024-01-15-preview")).toBe(true);
    expect(isVersionEarlierThan("2024-01-14", "2024-01-15-preview")).toBe(true);
    expect(isVersionEarlierThan("2024-01-16-preview", "2024-01-15")).toBe(false);

    // Both preview versions
    expect(isVersionEarlierThan("2024-01-14-preview", "2024-01-15-preview")).toBe(true);
    expect(isVersionEarlierThan("2024-01-15-preview", "2024-01-14-preview")).toBe(false);

    // Both stable versions
    expect(isVersionEarlierThan("2024-01-14", "2024-01-15")).toBe(true);
    expect(isVersionEarlierThan("2024-01-15", "2024-01-14")).toBe(false);
  });

  it("isVersionEarlierThan - identical versions", () => {
    // Same stable versions
    expect(isVersionEarlierThan("2024-01-15", "2024-01-15")).toBe(false);
    expect(isVersionEarlierThan("2023-12-31", "2023-12-31")).toBe(false);

    // Same preview versions
    expect(isVersionEarlierThan("2024-01-15-preview", "2024-01-15-preview")).toBe(false);
    expect(isVersionEarlierThan("2023-12-31-preview", "2023-12-31-preview")).toBe(false);
  });

  it("isVersionEarlierThan - edge cases", () => {
    // Empty or null values
    expect(isVersionEarlierThan("", "2024-01-15")).toBe(false);
    expect(isVersionEarlierThan("2024-01-15", "")).toBe(false);
    expect(isVersionEarlierThan("", "")).toBe(false);
    expect(isVersionEarlierThan(null as any, "2024-01-15")).toBe(false);
    expect(isVersionEarlierThan("2024-01-15", null as any)).toBe(false);
    expect(isVersionEarlierThan(undefined as any, undefined as any)).toBe(false);

    // Real-world examples
    expect(isVersionEarlierThan("2022-09-01", "2023-01-01")).toBe(true);
    expect(isVersionEarlierThan("2023-01-01-preview", "2023-01-01")).toBe(true);
    expect(isVersionEarlierThan("2023-01-01", "2023-01-01-preview")).toBe(false);
    expect(isVersionEarlierThan("2024-02-29", "2024-03-01")).toBe(true); // leap year
  });
});

describe("type-utils", () => {
  it("scopeExplicitlyIncludeJava", () => {
    expect(scopeExplicitlyIncludeJava("java")).toBe(true);
    expect(scopeExplicitlyIncludeJava("python,java")).toBe(true);
    expect(scopeExplicitlyIncludeJava("!python, java")).toBe(true);
    // "java" not included
    expect(scopeExplicitlyIncludeJava("python")).toBe(false);
    // negation handled in "scopeImplicitlyIncludeJava" function
    expect(scopeExplicitlyIncludeJava("!java")).toBe(false);
    expect(scopeExplicitlyIncludeJava("!(python,java)")).toBe(false);
    expect(scopeExplicitlyIncludeJava("!(python,csharp)")).toBe(false);
  });

  it("scopeImplicitlyIncludeJava", () => {
    expect(scopeImplicitlyIncludeJava("!python")).toBe(true);
    expect(scopeImplicitlyIncludeJava("python,!java")).toBe(false);
    expect(scopeImplicitlyIncludeJava("!(python, java)")).toBe(false);
    expect(scopeImplicitlyIncludeJava("!(python,csharp)")).toBe(true);
    // explicit "java" handled in "scopeExplicitlyIncludeJava" function
    expect(scopeImplicitlyIncludeJava("java")).toBe(false);
    expect(scopeImplicitlyIncludeJava("python")).toBe(false);
  });
});
