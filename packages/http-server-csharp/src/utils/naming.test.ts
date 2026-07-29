import { describe, expect, it } from "vitest";
import {
  getCSharpIdentifier,
  getValidChar,
  isValidCSharpIdentifier,
  NameCasingType,
  replaceCSharpReservedWord,
  transformInvalidIdentifier,
} from "./naming.js";

describe("getCSharpIdentifier", () => {
  it("converts to PascalCase for class context", () => {
    expect(getCSharpIdentifier("my-model", NameCasingType.Class)).toBe("MyModel");
  });

  it("converts to PascalCase for property context", () => {
    expect(getCSharpIdentifier("some-property", NameCasingType.Property)).toBe("SomeProperty");
  });

  it("converts to camelCase for parameter context", () => {
    expect(getCSharpIdentifier("some-param", NameCasingType.Parameter)).toBe("someParam");
  });

  it("converts to camelCase for variable context", () => {
    expect(getCSharpIdentifier("my-variable", NameCasingType.Variable)).toBe("myVariable");
  });

  it("handles namespace context with dots", () => {
    expect(getCSharpIdentifier("my-service.models", NameCasingType.Namespace)).toBe(
      "MyService.Models",
    );
  });

  it("replaces reserved words", () => {
    expect(getCSharpIdentifier("class", NameCasingType.Class)).toBe("ClassName");
    expect(getCSharpIdentifier("interface", NameCasingType.Class)).toBe("InterfaceName");
    expect(getCSharpIdentifier("namespace", NameCasingType.Class)).toBe("NamespaceName");
  });

  it("replaces contextual keywords", () => {
    expect(getCSharpIdentifier("async", NameCasingType.Class)).toBe("AsyncName");
    expect(getCSharpIdentifier("value", NameCasingType.Class)).toBe("ValueName");
    expect(getCSharpIdentifier("record", NameCasingType.Class)).toBe("RecordName");
  });

  it("returns Placeholder for undefined", () => {
    expect(getCSharpIdentifier(undefined as any)).toBe("Placeholder");
  });
});

describe("isValidCSharpIdentifier", () => {
  it("accepts valid identifiers", () => {
    expect(isValidCSharpIdentifier("MyClass")).toBe(true);
    expect(isValidCSharpIdentifier("_private")).toBe(true);
    expect(isValidCSharpIdentifier("name123")).toBe(true);
  });

  it("rejects invalid identifiers", () => {
    expect(isValidCSharpIdentifier("123start")).toBe(false);
    expect(isValidCSharpIdentifier("has-dash")).toBe(false);
    expect(isValidCSharpIdentifier("has space")).toBe(false);
  });

  it("accepts dots in namespace mode", () => {
    expect(isValidCSharpIdentifier("My.Namespace.Here", true)).toBe(true);
  });

  it("rejects dots in non-namespace mode", () => {
    expect(isValidCSharpIdentifier("My.Class", false)).toBe(false);
  });
});

describe("replaceCSharpReservedWord", () => {
  it("replaces reserved words case-insensitively", () => {
    expect(replaceCSharpReservedWord("class")).toBe("ClassName");
    expect(replaceCSharpReservedWord("CLASS")).toBe("ClassName");
  });

  it("does not replace non-reserved words", () => {
    expect(replaceCSharpReservedWord("myModel")).toBe("myModel");
  });
});

describe("getValidChar", () => {
  it("keeps valid starting characters", () => {
    expect(getValidChar("A", 0)).toBe("A");
    expect(getValidChar("_", 0)).toBe("_");
  });

  it("replaces invalid starting characters", () => {
    expect(getValidChar("1", 0)).toBe("Generated_1");
    expect(getValidChar("-", 0)).toBe("Generated_");
  });

  it("replaces non-word characters at other positions", () => {
    expect(getValidChar("-", 1)).toBe("_");
    expect(getValidChar(" ", 2)).toBe("_");
  });

  it("keeps valid characters at other positions", () => {
    expect(getValidChar("a", 1)).toBe("a");
    expect(getValidChar("3", 2)).toBe("3");
  });
});

describe("transformInvalidIdentifier", () => {
  it("transforms invalid identifier to valid one", () => {
    expect(transformInvalidIdentifier("1foo-bar")).toBe("Generated_1foo_bar");
  });

  it("keeps already valid identifiers", () => {
    expect(transformInvalidIdentifier("ValidName")).toBe("ValidName");
  });
});
