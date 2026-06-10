import { describe, expect, it } from "vitest";
import { formatCompilerFeatures } from "../../../../src/core/cli/actions/info.js";

function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

describe("formatCompilerFeatures", () => {
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
      "  enabled   function-declarations  Allows use of function declarations without experimental warnings in project code.",
    ]);
  });
});
