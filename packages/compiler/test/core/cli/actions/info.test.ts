import { expect, it } from "vitest";
import {
  formatCompilerFeatures,
  getPrintableConfig,
} from "../../../../src/core/cli/actions/info.js";

it("omits internal linter source metadata from printable config", () => {
  const config = getPrintableConfig({
    diagnostics: [],
    outputDir: "{cwd}/tsp-output",
    projectRoot: "/project",
    filename: "/project/tspconfig.yaml",
    linter: { extends: ["test/all"] },
    linterSource: { extends: "/base/tspconfig.yaml" },
  });

  expect(config).not.toHaveProperty("linterSource");
  expect(config).not.toHaveProperty("diagnostics");
  expect(config).not.toHaveProperty("file");
  expect(config.linter).toEqual({ extends: ["test/all"] });
});

function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

it("lists available compiler features and marks enabled features", () => {
  const output = stripAnsi(
    formatCompilerFeatures({
      diagnostics: [],
      outputDir: "{cwd}/tsp-output",
      projectRoot: "",
      kind: "project",
      features: ["function-declarations"],
    }).join("\n"),
  ).split("\n");

  expect(output).toEqual([
    "Compiler Features",
    "",
    "  enabled   function-declarations    Allows use of function declarations without experimental warnings in project code.",
    "  disabled  declaration-expressions  Allows use of declaration expressions (named or anonymous model, scalar, enum and union declarations in expression position) in project code.",
    "  disabled  auto-decorators          Allows use of auto decorator declarations without experimental warnings in project code.",
    "  disabled  type-info-provider       Enables the experimental `$provideTypeInfo` provider allowing libraries to contribute extra information about types to IDE hover and tooling (queried via `program.getTypeInfo`).",
    "  disabled  union-extends            Enables experimental union `extends` clauses in project code.",
  ]);
});
