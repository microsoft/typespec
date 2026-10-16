import { expectDiagnosticEmpty, expectDiagnostics, mockFile } from "@typespec/compiler/testing";
import { describe, it } from "vitest";
import { Tester } from "./test-host.js";

function libFile(name: string, linter?: unknown) {
  return mockFile.js({
    $lib: { name },
    ...(linter === undefined ? {} : { $linter: linter }),
  });
}

const casingRule = {
  name: "casing",
  severity: "warning",
  description: "casing",
  messages: { default: "casing" },
  create: () => ({}),
};

async function diagnoseLib(linter: unknown, extraFiles: Record<string, any> = {}) {
  const imports = ["./mylib.js", ...Object.keys(extraFiles)]
    .map((x) => `import "${x}";`)
    .join("\n");
  return Tester.files({
    "./mylib.js": libFile("@test/mylib", linter),
    ...extraFiles,
  }).diagnose(imports);
}

describe("validate rulesets", () => {
  it("emits no diagnostic when a ruleset references a rule of its own library", async () => {
    const diagnostics = await diagnoseLib({
      rules: [casingRule],
      ruleSets: { recommended: { enable: { "@test/mylib/casing": true } } },
    });
    expectDiagnosticEmpty(diagnostics);
  });

  it("emits a diagnostic when a ruleset enables a rule that does not exist", async () => {
    const diagnostics = await diagnoseLib({
      rules: [casingRule],
      ruleSets: { recommended: { enable: { "@test/mylib/removed": true } } },
    });
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/unknown-rule",
      severity: "warning",
      message:
        "Rule 'removed' referenced by ruleset '@test/mylib/recommended' is not defined in library '@test/mylib'.",
    });
  });

  it("emits a diagnostic when a ruleset disables a rule that does not exist", async () => {
    const diagnostics = await diagnoseLib({
      rules: [casingRule],
      ruleSets: { recommended: { disable: { "@test/mylib/removed": "gone" } } },
    });
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/unknown-rule",
      message:
        "Rule 'removed' referenced by ruleset '@test/mylib/recommended' is not defined in library '@test/mylib'.",
    });
  });

  it("emits a diagnostic when a ruleset extends a ruleset that does not exist", async () => {
    const diagnostics = await diagnoseLib({
      rules: [casingRule],
      ruleSets: { recommended: { extends: ["@test/mylib/missing"] } },
    });
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/unknown-rule-set",
      message:
        "Ruleset 'missing' referenced by ruleset '@test/mylib/recommended' is not defined in library '@test/mylib'.",
    });
  });

  it("emits a diagnostic when a reference is not in the '<library-name>/<name>' format", async () => {
    const diagnostics = await diagnoseLib({
      rules: [casingRule],
      ruleSets: { recommended: { enable: { removed: true } } },
    });
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/invalid-rule-reference",
      message: `Reference 'removed' in ruleset '@test/mylib/recommended' is invalid. It must be in the format "<library-name>/<name>".`,
    });
  });

  it("resolves references to the auto generated `all` ruleset", async () => {
    const diagnostics = await diagnoseLib({
      rules: [casingRule],
      ruleSets: { recommended: { extends: ["@test/mylib/all"] } },
    });
    expectDiagnosticEmpty(diagnostics);
  });

  it("resolves references to rules of another library in the compilation", async () => {
    const diagnostics = await diagnoseLib(
      { rules: [], ruleSets: { recommended: { enable: { "@test/other/casing": true } } } },
      { "./other.js": libFile("@test/other", { rules: [casingRule] }) },
    );
    expectDiagnosticEmpty(diagnostics);
  });

  it("emits a diagnostic for a missing rule of another library in the compilation", async () => {
    const diagnostics = await diagnoseLib(
      { rules: [], ruleSets: { recommended: { enable: { "@test/other/removed": true } } } },
      { "./other.js": libFile("@test/other", { rules: [casingRule] }) },
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/unknown-rule",
      message:
        "Rule 'removed' referenced by ruleset '@test/mylib/recommended' is not defined in library '@test/other'.",
    });
  });

  it("emits a diagnostic for a rule of a library in the compilation that defines no linter", async () => {
    const diagnostics = await diagnoseLib(
      { rules: [], ruleSets: { recommended: { enable: { "@test/other/casing": true } } } },
      { "./other.js": libFile("@test/other") },
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/unknown-rule",
      message:
        "Rule 'casing' referenced by ruleset '@test/mylib/recommended' is not defined in library '@test/other'.",
    });
  });

  it("validates every ruleset defined in the project being compiled", async () => {
    const diagnostics = await diagnoseLib(
      { rules: [casingRule] },
      {
        "./other.js": libFile("@test/other", {
          rules: [],
          ruleSets: { recommended: { enable: { "@test/other/removed": true } } },
        }),
      },
    );
    expectDiagnostics(diagnostics, {
      code: "@typespec/library-linter/unknown-rule",
      message:
        "Rule 'removed' referenced by ruleset '@test/other/recommended' is not defined in library '@test/other'.",
    });
  });

  it("ignores references to a library that is not part of the compilation", async () => {
    const diagnostics = await diagnoseLib({
      rules: [casingRule],
      ruleSets: { recommended: { enable: { "@test/not-installed/some-rule": true } } },
    });
    expectDiagnosticEmpty(diagnostics);
  });
});
