import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { ExternalError } from "../src/core/external-error.js";
import type { CompilerOptions } from "../src/core/options.js";
import type { InfoContext } from "../src/core/types.js";
import { mockFile, t } from "../src/testing/index.js";
import { Tester } from "./tester.js";

const withFeature: { compilerOptions: CompilerOptions } = {
  compilerOptions: {
    configFile: {
      projectRoot: ".",
      kind: "project",
      features: ["type-info-hook"],
      diagnostics: [],
      outputDir: "tsp-output",
    },
  },
};

describe("compiler: $onInfo hook", () => {
  it("merges the content contributed by multiple providers into a single result", async () => {
    const runner = await Tester.files({
      "info1.js": mockFile.js({
        $onInfo: ({ target }: InfoContext) =>
          target.kind === "Operation" ? { content: "a" } : undefined,
      }),
      "info2.js": mockFile.js({
        $onInfo: ({ target }: InfoContext) =>
          target.kind === "Operation" ? { content: "b" } : undefined,
      }),
    })
      .import("./info1.js", "./info2.js")
      .createInstance();

    const { foo } = await runner.compile(t.code`op ${t.op("foo")}(): void;`, withFeature);
    deepStrictEqual(runner.program.getTypeInfo(foo), { content: "a\n\nb" });
  });

  it("returns undefined when no provider contributes for the type", async () => {
    const runner = await Tester.files({
      "info.js": mockFile.js({
        $onInfo: ({ target }: InfoContext) =>
          target.kind === "Operation" ? { content: "a" } : undefined,
      }),
    })
      .import("./info.js")
      .createInstance();

    const { foo } = await runner.compile(t.code`model ${t.model("foo")} {}`, withFeature);
    strictEqual(runner.program.getTypeInfo(foo), undefined);
  });

  it("returns undefined when the `type-info-hook` feature is not enabled", async () => {
    const runner = await Tester.files({
      "info.js": mockFile.js({
        $onInfo: ({ target }: InfoContext) =>
          target.kind === "Operation" ? { content: "a" } : undefined,
      }),
    })
      .import("./info.js")
      .createInstance();

    const { foo } = await runner.compile(t.code`op ${t.op("foo")}(): void;`);
    strictEqual(runner.program.getTypeInfo(foo), undefined);
  });

  it("wraps provider crashes in an ExternalError", async () => {
    const runner = await Tester.files({
      "info.js": mockFile.js({
        $onInfo: () => {
          throw new Error("boom");
        },
      }),
    })
      .import("./info.js")
      .createInstance();

    const { foo } = await runner.compile(t.code`op ${t.op("foo")}(): void;`, withFeature);
    let error: unknown;
    try {
      runner.program.getTypeInfo(foo);
    } catch (e) {
      error = e;
    }
    ok(error instanceof ExternalError, "Expected getTypeInfo to throw an ExternalError");
  });
});
