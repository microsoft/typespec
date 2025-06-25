import { describe, expect, it } from "vitest";
import { scopeExplicitlyIncludeJava, scopeImplicitlyIncludeJava } from "../src/type-utils.js";
import {
  optionBoolean,
  pascalCase,
  removeClientSuffix,
  stringArrayContainsIgnoreCase,
} from "../src/utils.js";
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
    expect(isStableApiVersion("2022-09-01")).toBe(true);
    expect(isStableApiVersion("2023-12-01-preview")).toBe(false);
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
