import { deepStrictEqual, strictEqual } from "assert";
import { describe, it } from "vitest";
import { buildCommandArgs } from "../src/emitter.js";

describe("typespec-python: emitter", () => {
  it("preserves transformed command arguments", () => {
    const commandArgs = buildCommandArgs(
      {
        license: "MIT",
        "package-name": "sample-package",
        "generate-packaging-files": false,
        "packaging-files-config": {
          README: "README.md",
          LICENSE: "LICENSE.txt",
        },
        "keep-pyproject-fields": {
          authors: true,
          description: true,
          classifiers: false,
        },
      },
      false,
    );

    strictEqual(commandArgs["package-name"], "sample-package");
    strictEqual(
      commandArgs["packaging-files-config"],
      "README:README.md|LICENSE:LICENSE.txt",
    );
    strictEqual(commandArgs["keep-pyproject-fields"], "authors,description");
    strictEqual(commandArgs["from-typespec"], "true");
    strictEqual(commandArgs["models-mode"], "dpg");
    deepStrictEqual("license" in commandArgs, false);
  });
});
