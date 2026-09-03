import { describe, expect, it } from "vitest";
import {
  createDiagnosticCodeResolver,
  getPackageShortName,
  isValidLibraryAlias,
} from "../../src/core/diagnostic-code.js";

describe("getPackageShortName", () => {
  it("prefers an explicit alias", () => {
    expect(getPackageShortName("@azure-tools/typespec-client-generator-core", "tcgc")).toEqual(
      "tcgc",
    );
  });

  it("strips the @typespec scope", () => {
    expect(getPackageShortName("@typespec/http")).toEqual("http");
    expect(getPackageShortName("@typespec/compiler")).toEqual("compiler");
  });

  it("strips a scoped typespec- prefix", () => {
    expect(getPackageShortName("@azure-tools/typespec-autorest")).toEqual("autorest");
  });

  it("strips an unscoped typespec- prefix", () => {
    expect(getPackageShortName("typespec-foo")).toEqual("foo");
  });

  it("returns undefined when no short form applies", () => {
    expect(getPackageShortName("some-random-package")).toBeUndefined();
    expect(getPackageShortName("@scope/other")).toBeUndefined();
  });
});

describe("isValidLibraryAlias", () => {
  it.each(["tcgc", "http", "my-lib-2", "a", "client-generator-core"])("accepts %s", (alias) => {
    expect(isValidLibraryAlias(alias)).toBe(true);
  });

  it.each(["", "Foo", "foo/bar", "foo bar", "-foo", "foo-", "foo--bar", "foo_bar"])(
    "rejects %s",
    (alias) => {
      expect(isValidLibraryAlias(alias)).toBe(false);
    },
  );
});

describe("createDiagnosticCodeResolver", () => {
  const resolver = createDiagnosticCodeResolver([
    { name: "@typespec/http" },
    { name: "@typespec/compiler" },
    { name: "@azure-tools/typespec-autorest" },
    { name: "@azure-tools/typespec-client-generator-core", alias: "tcgc" },
  ]);

  describe("resolveCode", () => {
    it("resolves a scope-stripped short name to the full code", () => {
      expect(resolver.resolveCode("http/no-foo")).toEqual("@typespec/http/no-foo");
    });

    it("resolves a typespec- stripped short name to the full code", () => {
      expect(resolver.resolveCode("autorest/no-foo")).toEqual(
        "@azure-tools/typespec-autorest/no-foo",
      );
    });

    it("resolves an aliased short name to the full code", () => {
      expect(resolver.resolveCode("tcgc/no-foo")).toEqual(
        "@azure-tools/typespec-client-generator-core/no-foo",
      );
    });

    it("keeps a full code unchanged", () => {
      expect(resolver.resolveCode("@typespec/http/no-foo")).toEqual("@typespec/http/no-foo");
    });

    it("keeps a code with a nested rule path unchanged", () => {
      expect(resolver.resolveCode("http/casing/rule")).toEqual("@typespec/http/casing/rule");
    });

    it("keeps an unknown short name unchanged", () => {
      expect(resolver.resolveCode("unknown/no-foo")).toEqual("unknown/no-foo");
    });

    it("keeps a bare compiler code unchanged", () => {
      expect(resolver.resolveCode("unknown-identifier")).toEqual("unknown-identifier");
    });
  });

  describe("short name conflicts", () => {
    const conflicting = createDiagnosticCodeResolver([
      { name: "@typespec/http" },
      { name: "typespec-http" },
    ]);

    it("does not resolve an ambiguous short name", () => {
      expect(conflicting.resolveCode("http/no-foo")).toEqual("http/no-foo");
    });

    it("still resolves non-conflicting libraries", () => {
      const mixed = createDiagnosticCodeResolver([
        { name: "@typespec/http" },
        { name: "typespec-http" },
        { name: "@typespec/openapi3" },
      ]);
      expect(mixed.resolveCode("openapi3/no-foo")).toEqual("@typespec/openapi3/no-foo");
    });
  });

  describe("getAmbiguousShortName", () => {
    const conflicting = createDiagnosticCodeResolver([
      { name: "@typespec/http" },
      { name: "typespec-http" },
      { name: "@typespec/openapi3" },
    ]);

    it("returns the conflicting candidates for an ambiguous short name", () => {
      expect(conflicting.getAmbiguousShortName("http/no-foo")).toEqual({
        shortName: "http",
        candidates: ["@typespec/http", "typespec-http"],
      });
    });

    it("returns undefined for an unambiguous short name", () => {
      expect(conflicting.getAmbiguousShortName("openapi3/no-foo")).toBeUndefined();
    });

    it("returns undefined for a full code even when the short name is ambiguous", () => {
      expect(conflicting.getAmbiguousShortName("@typespec/http/no-foo")).toBeUndefined();
    });

    it("returns undefined for an unknown short name", () => {
      expect(conflicting.getAmbiguousShortName("unknown/no-foo")).toBeUndefined();
    });

    it("returns undefined for a bare compiler code", () => {
      expect(conflicting.getAmbiguousShortName("unknown-identifier")).toBeUndefined();
    });
  });
});
