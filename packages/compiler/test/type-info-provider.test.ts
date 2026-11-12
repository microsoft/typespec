import { describe, expect, it } from "vitest";
import { ExternalError } from "../src/core/external-error.js";
import type { CompilerOptions } from "../src/core/options.js";
import type { TypeInfoContext } from "../src/core/types.js";
import { mockFile, t } from "../src/testing/index.js";
import { Tester } from "./tester.js";

/** Root project config enabling the `type-info-provider` feature for the project's own files. */
const projectFeature: { compilerOptions: CompilerOptions } = {
  compilerOptions: {
    configFile: {
      projectRoot: ".",
      kind: "project",
      features: ["type-info-provider"],
      diagnostics: [],
      outputDir: "tsp-output",
    },
  },
};

const opInfoHook = (content: string) =>
  mockFile.js({
    $provideTypeInfo: ({ target }: TypeInfoContext) =>
      target.kind === "Operation" ? { content } : undefined,
  });

describe("compiler: $provideTypeInfo hook", () => {
  it("merges the content contributed by multiple providers into a single result", async () => {
    const runner = await Tester.files({
      "info1.js": opInfoHook("a"),
      "info2.js": opInfoHook("b"),
    })
      .import("./info1.js", "./info2.js")
      .createInstance();

    const { foo } = await runner.compile(t.code`op ${t.op("foo")}(): void;`, projectFeature);
    expect(runner.program.getTypeInfo(foo)).toEqual({ content: "a\n\nb" });
  });

  it("returns undefined when no provider contributes for the type", async () => {
    const runner = await Tester.files({ "info.js": opInfoHook("a") })
      .import("./info.js")
      .createInstance();

    const { foo } = await runner.compile(t.code`model ${t.model("foo")} {}`, projectFeature);
    expect(runner.program.getTypeInfo(foo)).toBeUndefined();
  });

  it("ignores the hook when the declaring project did not enable the `type-info-provider` feature", async () => {
    const runner = await Tester.files({ "info.js": opInfoHook("a") })
      .import("./info.js")
      .createInstance();

    const { foo } = await runner.compile(t.code`op ${t.op("foo")}(): void;`);
    expect(runner.program.getTypeInfo(foo)).toBeUndefined();
  });

  const crashingHook = mockFile.js({
    $provideTypeInfo: () => {
      throw new Error("boom");
    },
  });

  it("wraps provider crashes in an ExternalError", async () => {
    const runner = await Tester.files({
      "info.js": crashingHook,
    })
      .import("./info.js")
      .createInstance();

    const { foo } = await runner.compile(t.code`op ${t.op("foo")}(): void;`, projectFeature);
    expect(() => runner.program.getTypeInfo(foo)).toThrow(ExternalError);
  });

  it("swallows provider crashes in a design time build without mutating program diagnostics", async () => {
    const runner = await Tester.files({ "info.js": crashingHook })
      .import("./info.js")
      .createInstance();

    const { foo } = await runner.compile(t.code`op ${t.op("foo")}(): void;`, {
      compilerOptions: { ...projectFeature.compilerOptions, designTimeBuild: true },
    });

    // `getTypeInfo` runs long after compilation, so a crash must not append to the (cached)
    // program's diagnostics nor break the editor.
    const before = runner.program.diagnostics.length;
    expect(runner.program.getTypeInfo(foo)).toBeUndefined();
    expect(runner.program.getTypeInfo(foo)).toBeUndefined();
    expect(runner.program.diagnostics.length).toBe(before);
  });

  it("keeps collecting from healthy providers when one crashes in a design time build", async () => {
    const runner = await Tester.files({
      "crash.js": crashingHook,
      "ok.js": opInfoHook("still here"),
    })
      .import("./crash.js", "./ok.js")
      .createInstance();

    const { foo } = await runner.compile(t.code`op ${t.op("foo")}(): void;`, {
      compilerOptions: { ...projectFeature.compilerOptions, designTimeBuild: true },
    });

    expect(runner.program.getTypeInfo(foo)).toEqual({ content: "still here" });
  });

  describe("feature is scoped to the library declaring the hook", () => {
    function testerWithLib(tspconfig?: string) {
      return Tester.files({
        "node_modules/my-lib/package.json": JSON.stringify({ name: "my-lib", main: "index.js" }),
        "node_modules/my-lib/index.js": opInfoHook("from-lib"),
        ...(tspconfig ? { "node_modules/my-lib/tspconfig.yaml": tspconfig } : {}),
      }).import("my-lib");
    }

    it("respects the hook when the library enables the feature in its own tspconfig.yaml", async () => {
      const runner = await testerWithLib(
        `kind: project\nfeatures:\n  - type-info-provider\n`,
      ).createInstance();

      // The consumer does NOT enable the feature; the library's opt-in is enough.
      const { foo } = await runner.compile(t.code`op ${t.op("foo")}(): void;`);
      expect(runner.program.getTypeInfo(foo)).toEqual({ content: "from-lib" });
    });

    it("ignores the hook when the library does not enable the feature", async () => {
      const runner = await testerWithLib().createInstance();

      const { foo } = await runner.compile(t.code`op ${t.op("foo")}(): void;`);
      expect(runner.program.getTypeInfo(foo)).toBeUndefined();
    });

    it("enabling the feature in the consumer project does not enable it for library code", async () => {
      const runner = await testerWithLib().createInstance();

      const { foo } = await runner.compile(t.code`op ${t.op("foo")}(): void;`, projectFeature);
      expect(runner.program.getTypeInfo(foo)).toBeUndefined();
    });
  });
});
