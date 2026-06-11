import { strictEqual } from "assert";
import { describe, it } from "vitest";
import {
  enumClassName,
  enumValueName,
  padSpecialChars,
} from "../../src/codegen/enums/python-naming.js";

describe("typespec-python: enum naming transforms", () => {
  it("padSpecialChars replaces disallowed characters with underscores", () => {
    strictEqual(padSpecialChars("foo.bar"), "foo_bar");
    strictEqual(padSpecialChars("a+b/c"), "a_b_c");
    // Underscores are preserved (valid Python identifier character).
    strictEqual(padSpecialChars("a_b"), "a_b");
  });

  it("enumClassName capitalizes the first letter", () => {
    strictEqual(enumClassName("color"), "Color");
    strictEqual(enumClassName("Priority"), "Priority");
    strictEqual(enumClassName("myEnum"), "MyEnum");
  });

  it("enumClassName pads reserved words with the Enum suffix", () => {
    strictEqual(enumClassName("enum"), "EnumEnum");
    strictEqual(enumClassName("class"), "ClassEnum");
    strictEqual(enumClassName("int"), "IntEnum");
  });

  it("enumClassName replaces special characters", () => {
    strictEqual(enumClassName("foo.bar"), "Foo_bar");
  });

  it("enumValueName upper-cases the value", () => {
    strictEqual(enumValueName("red"), "RED");
    strictEqual(enumValueName("low_priority"), "LOW_PRIORITY");
  });

  it("enumValueName prefixes ENUM_ when starting with a digit", () => {
    strictEqual(enumValueName("2d"), "ENUM_2D");
    strictEqual(enumValueName("1"), "ENUM_1");
  });
});
