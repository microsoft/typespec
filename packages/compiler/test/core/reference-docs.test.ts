import { describe, expect, it } from "vitest";
import { createLinterRule, createTypeSpecLibrary } from "../../src/core/library.js";
import { resolveLinterDefinition } from "../../src/core/linter.js";
import { NoTarget } from "../../src/core/types.js";

const baseUrl = "https://example.com/reference/";

describe("reference documentation URLs", () => {
  it("generates a diagnostic URL only when docs are provided", () => {
    const lib = createTypeSpecLibrary({
      name: "test-lib",
      referenceDocs: { baseUrl },
      diagnostics: {
        documented: {
          severity: "error",
          docs: "Extended documentation.",
          messages: { default: "Documented." },
        },
        undocumented: {
          severity: "error",
          messages: { default: "Undocumented." },
        },
      },
    });

    expect(lib.createDiagnostic({ code: "documented", target: NoTarget }).url).toBe(
      "https://example.com/reference/diagnostics/documented",
    );
    expect(lib.createDiagnostic({ code: "undocumented", target: NoTarget }).url).toBeUndefined();
  });

  it("preserves an explicit diagnostic URL", () => {
    const lib = createTypeSpecLibrary({
      name: "test-lib",
      referenceDocs: { baseUrl },
      diagnostics: {
        documented: {
          severity: "error",
          docs: "Extended documentation.",
          url: "https://example.com/custom",
          messages: { default: "Documented." },
        },
      },
    });

    expect(lib.createDiagnostic({ code: "documented", target: NoTarget }).url).toBe(
      "https://example.com/custom",
    );
  });

  it("generates a linter rule URL only when docs are provided and preserves explicit URLs", () => {
    const documented = createLinterRule({
      name: "documented",
      severity: "warning",
      description: "Documented.",
      docs: "Extended documentation.",
      messages: { default: "Documented." },
      create: () => ({}),
    });
    const undocumented = createLinterRule({
      name: "undocumented",
      severity: "warning",
      description: "Undocumented.",
      messages: { default: "Undocumented." },
      create: () => ({}),
    });
    const explicit = createLinterRule({
      name: "explicit",
      severity: "warning",
      description: "Explicit.",
      docs: "Extended documentation.",
      url: "https://example.com/custom",
      messages: { default: "Explicit." },
      create: () => ({}),
    });

    const resolved = resolveLinterDefinition(
      "test-lib",
      { rules: [documented, undocumented, explicit] },
      baseUrl,
    );

    expect(resolved.rules.find((x) => x.name === "documented")?.url).toBe(
      "https://example.com/reference/rules/documented",
    );
    expect(resolved.rules.find((x) => x.name === "undocumented")?.url).toBeUndefined();
    expect(resolved.rules.find((x) => x.name === "explicit")?.url).toBe(
      "https://example.com/custom",
    );
  });
});
