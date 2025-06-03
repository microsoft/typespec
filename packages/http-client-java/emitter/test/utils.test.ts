import { describe, expect, it } from "vitest";
import { scopeContainsJava, scopeContainsNegativeNonJava } from "../src/type-utils.js";
import { pascalCase, removeClientSuffix, stringArrayContainsIgnoreCase } from "../src/utils.js";
import { isStableApiVersion } from "../src/versioning-utils.js";

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
});

describe("versioning-utils", () => {
  it("isStableApiVersion", () => {
    expect(isStableApiVersion("2022-09-01")).toBe(true);
    expect(isStableApiVersion("2023-12-01-preview")).toBe(false);
  });
});

describe("type-utils", () => {
  it("scopeContainsJava", () => {
    expect(scopeContainsJava("java")).toBe(true);
    expect(scopeContainsJava("python,java")).toBe(true);
    expect(scopeContainsJava("!python, java")).toBe(true);
    expect(scopeContainsJava("!java")).toBe(false);
    expect(scopeContainsJava("python")).toBe(false);
  });

  it("scopeContainsNegativeNonJava", () => {
    expect(scopeContainsNegativeNonJava("java")).toBe(false);
    expect(scopeContainsNegativeNonJava("!python")).toBe(true);
    expect(scopeContainsNegativeNonJava("python")).toBe(false);
    expect(scopeContainsNegativeNonJava("python,!java")).toBe(false);
  });
});
