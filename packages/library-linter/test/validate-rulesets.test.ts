import { mockFile } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { Tester } from "./test-host.js";

function libFile(name: string, linter: unknown) {
  return mockFile.js({
    $lib: { name },
    $linter: linter,
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
  const diagnostics = await Tester.files({
    "./mylib.js": libFile("@test/mylib", linter),
    ...extraFiles,
  }).diagnose(imports);
  return diagnostics.filter((x) => x.code.startsWith("@typespec/library-linter/unknown"));
}

describe("validate rulesets", () => {
  it("emits no diagnostic when a ruleset references a rule of its own library", async () => {
    const diagnostics = await diagnoseLib({
      rules: [casingRule],
      ruleSets: { recommended: { enable: { "@test/mylib/casing": true } } },
    });
    expect(diagnostics).toHaveLength(0);
  });

  it("emits a diagnostic when a ruleset enables a rule that does not exist", async () => {
    const diagnostics = await diagnoseLib({
      rules: [casingRule],
      ruleSets: { recommended: { enable: { "@test/mylib/removed": true } } },
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe("@typespec/library-linter/unknown-rule");
    expect(diagnostics[0].message).toBe(
      "Rule 'removed' referenced by ruleset '@test/mylib/recommended' is not defined in library '@test/mylib'.",
    );
  });

  it("emits a diagnostic when a ruleset disables a rule that does not exist", async () => {
    const diagnostics = await diagnoseLib({
      rules: [casingRule],
      ruleSets: { recommended: { disable: { "@test/mylib/removed": "gone" } } },
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe("@typespec/library-linter/unknown-rule");
  });

  it("emits a diagnostic when a ruleset extends a ruleset that does not exist", async () => {
    const diagnostics = await diagnoseLib({
      rules: [casingRule],
      ruleSets: { recommended: { extends: ["@test/mylib/missing"] } },
    });
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].code).toBe("@typespec/library-linter/unknown-rule-set");
    expect(diagnostics[0].message).toBe(
      "Ruleset 'missing' referenced by ruleset '@test/mylib/recommended' is not defined in library '@test/mylib'.",
    );
  });

  it("resolves references to the auto generated `all` ruleset", async () => {
    const diagnostics = await diagnoseLib({
      rules: [casingRule],
      ruleSets: { recommended: { extends: ["@test/mylib/all"] } },
    });
    expect(diagnostics).toHaveLength(0);
  });

  it("resolves references to rules of another library in the compilation", async () => {
    const diagnostics = await diagnoseLib(
      { rules: [], ruleSets: { recommended: { enable: { "@test/other/casing": true } } } },
      { "./other.js": libFile("@test/other", { rules: [casingRule] }) },
    );
    expect(diagnostics).toHaveLength(0);
  });

  it("emits a diagnostic for a missing rule of another library in the compilation", async () => {
    const diagnostics = await diagnoseLib(
      { rules: [], ruleSets: { recommended: { enable: { "@test/other/removed": true } } } },
      { "./other.js": libFile("@test/other", { rules: [casingRule] }) },
    );
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toBe(
      "Rule 'removed' referenced by ruleset '@test/mylib/recommended' is not defined in library '@test/other'.",
    );
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
    expect(diagnostics).toHaveLength(1);
  });

  it("ignores references to a library that is not part of the compilation", async () => {
    const diagnostics = await diagnoseLib({
      rules: [casingRule],
      ruleSets: { recommended: { enable: { "@test/not-installed/some-rule": true } } },
    });
    expect(diagnostics).toHaveLength(0);
  });
});
