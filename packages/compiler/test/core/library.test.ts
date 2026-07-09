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

  it("throws when the alias contains a '/'", () => {
    expect(() =>
      createTypeSpecLibrary({ name: "@typespec/test", alias: "foo/bar", diagnostics: {} }),
    ).toThrow(/alias cannot contain a '\/'/);
  });
});
