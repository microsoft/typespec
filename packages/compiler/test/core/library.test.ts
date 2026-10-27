import { describe, expect, it } from "vitest";
import { createTypeSpecLibrary } from "../../src/core/library.js";

describe("createTypeSpecLibrary", () => {
  it("accepts a library without an alias", () => {
    expect(() => createTypeSpecLibrary({ name: "@typespec/test", diagnostics: {} })).not.toThrow();
  });

  it("accepts a valid alias", () => {
    expect(() =>
      createTypeSpecLibrary({ name: "@typespec/test", alias: "test", diagnostics: {} }),
    ).not.toThrow();
  });

  it("accepts a kebab-case alias with digits", () => {
    expect(() =>
      createTypeSpecLibrary({ name: "@typespec/test", alias: "my-lib-2", diagnostics: {} }),
    ).not.toThrow();
  });

  it("throws when the alias contains a '/'", () => {
    expect(() =>
      createTypeSpecLibrary({ name: "@typespec/test", alias: "foo/bar", diagnostics: {} }),
    ).toThrow(/alias "foo\/bar".*is invalid/);
  });

  it("throws when the alias is an empty string", () => {
    expect(() =>
      createTypeSpecLibrary({ name: "@typespec/test", alias: "", diagnostics: {} }),
    ).toThrow(/is invalid/);
  });

  it("throws when the alias contains uppercase letters", () => {
    expect(() =>
      createTypeSpecLibrary({ name: "@typespec/test", alias: "Foo", diagnostics: {} }),
    ).toThrow(/is invalid/);
  });

  it("throws when the alias contains invalid characters", () => {
    expect(() =>
      createTypeSpecLibrary({ name: "@typespec/test", alias: "foo bar", diagnostics: {} }),
    ).toThrow(/is invalid/);
  });
});
