import { expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { renderToAstroStarlightMarkdown } from "../../../src/ref-doc/emitters/starlight.js";
import { extractTestRefDoc } from "../../test-utils.js";

async function createRefDoc(code: string) {
  const [refDoc, diagnostics] = await extractTestRefDoc(`namespace Lib; ${code}`);
  expectDiagnosticEmpty(diagnostics);
  return refDoc;
}

describe("starlight emitter", () => {
  it("generates model docs files", async () => {
    const refDoc = await createRefDoc(`model Test {}`);

    const files = renderToAstroStarlightMarkdown({
      ...refDoc,
      name: "@typespec/test",
      packageJson: {},
    } as any);

    expect(Object.keys(files).sort()).toEqual(["data-types.md", "index.mdx"]);
    expect(files["data-types.md"]).toContain("model Lib.Test");
  });

  it("writes linter rule pages under the configured rules directory", async () => {
    const refDoc = await createRefDoc(``);

    const files = renderToAstroStarlightMarkdown(
      {
        ...refDoc,
        name: "@typespec/test",
        packageJson: {},
        linter: {
          ruleSets: [
            {
              kind: "ruleset",
              id: "Lib.default",
              name: "Lib/default",
              ruleSet: {},
            },
          ],
          rules: [
            {
              kind: "rule",
              id: "Lib.my-rule",
              name: "my-rule",
              rule: {
                name: "my-rule",
                description: "My rule description",
              },
              doc: "My extended rule docs",
            },
          ],
        },
      } as any,
      { rulesDir: "../rules" },
    );

    expect(files["linter.md"]).toContain("[`my-rule`](../rules/my-rule.md)");
    expect(files["../rules/my-rule.md"]).toContain("My extended rule docs");
  });

  it("generates diagnostic pages only for documented diagnostics", async () => {
    const refDoc = await createRefDoc(``);

    const files = renderToAstroStarlightMarkdown({
      ...refDoc,
      name: "@typespec/test",
      packageJson: {},
      diagnostics: [
        {
          id: "LIB001",
          name: "LIB001",
          severity: "warning",
          doc: "Diagnostic documentation",
        },
        {
          id: "LIB002",
          name: "LIB002",
          severity: "error",
        },
      ],
    } as any);

    expect(files["diagnostics/LIB001.md"]).toContain("**Severity:** warning");
    expect(files["diagnostics/LIB002.md"]).toBeUndefined();
  });
});
