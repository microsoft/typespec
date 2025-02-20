import { describe, expect, it } from "vitest";
import {
  isStableApiVersion,
  pascalCase,
  removeClientSuffix,
  stringArrayContainsIgnoreCase,
} from "../src/utils";

describe("utils", () => {
  it("isStableApiVersion", () => {
    expect(isStableApiVersion("2022-09-01")).toBe(true);
    expect(isStableApiVersion("2023-12-01-preview")).toBe(false);
  });

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
