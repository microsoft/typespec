import { describe, expect, it } from "vitest";
import {
  createDiagnosticCodeResolver,
  getPackageShortName,
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

  describe("getDisplayCode", () => {
    it("returns the short form for a known library", () => {
      expect(resolver.getDisplayCode("@typespec/http/no-foo")).toEqual("http/no-foo");
    });

    it("returns the aliased short form", () => {
      expect(resolver.getDisplayCode("@azure-tools/typespec-client-generator-core/no-foo")).toEqual(
        "tcgc/no-foo",
      );
    });

    it("returns the full code for an unknown library", () => {
      expect(resolver.getDisplayCode("@scope/other/no-foo")).toEqual("@scope/other/no-foo");
    });

    it("returns a bare compiler code unchanged", () => {
      expect(resolver.getDisplayCode("unknown-identifier")).toEqual("unknown-identifier");
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

    it("displays the full name for conflicting libraries", () => {
      expect(conflicting.getDisplayCode("@typespec/http/no-foo")).toEqual("@typespec/http/no-foo");
      expect(conflicting.getDisplayCode("typespec-http/no-foo")).toEqual("typespec-http/no-foo");
    });

    it("still resolves and displays non-conflicting libraries", () => {
      const mixed = createDiagnosticCodeResolver([
        { name: "@typespec/http" },
        { name: "typespec-http" },
        { name: "@typespec/openapi3" },
      ]);
      expect(mixed.resolveCode("openapi3/no-foo")).toEqual("@typespec/openapi3/no-foo");
      expect(mixed.getDisplayCode("@typespec/openapi3/no-foo")).toEqual("openapi3/no-foo");
    });
  });
});
