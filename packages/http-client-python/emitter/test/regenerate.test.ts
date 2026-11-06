import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import {
  compileSpec,
  getEmitterOptions,
  getSubdirectories,
  type RegenerateContext,
} from "../../eng/scripts/ci/regenerate-common.js";

describe("discriminated union spec regeneration", () => {
  it("skips unsupported unconstrained scenarios without skipping the extends suite", async () => {
    const root = await mkdtemp(join(tmpdir(), "python-spec-discovery-"));
    try {
      const parent = join(root, "type", "union", "discriminated");
      const child = join(parent, "extends");
      await mkdir(child, { recursive: true });
      await writeFile(join(parent, "main.tsp"), "");
      await writeFile(join(child, "main.tsp"), "");
      const skippedChild = join(root, "type", "file", "nested");
      await mkdir(skippedChild, { recursive: true });
      await writeFile(join(skippedChild, "main.tsp"), "");
      expect(await getSubdirectories(root, { flavor: "unbranded" })).toEqual([
        join(child, "main.tsp"),
      ]);
      const ctx: RegenerateContext = {
        httpSpecs: root,
        azureHttpSpecs: root,
        pluginDir: root,
        generatedFolder: root,
        emitterName: "test-emitter",
      };
      expect(getEmitterOptions(join(child, "main.tsp"), "unbranded", ctx)).toEqual([
        {
          "package-name": "typetest-discriminatedunion-extends",
        },
      ]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("honors the spec's project feature configuration", async () => {
    const root = await mkdtemp(join(tmpdir(), "python-spec-features-"));
    try {
      const spec = join(root, "main.tsp");
      const emitter = join(root, "emitter.mjs");
      await writeFile(
        spec,
        "model Base {} model Cat extends Base {} union Pet extends Base { cat: Cat }",
      );
      await writeFile(
        join(root, "tspconfig.yaml"),
        "kind: project\nfeatures:\n  - union-extends\n",
      );
      await writeFile(emitter, "export function $onEmit() {}");
      const result = await compileSpec(
        { spec, outputDir: join(root, "output"), options: {} },
        {
          httpSpecs: root,
          azureHttpSpecs: root,
          pluginDir: emitter,
          generatedFolder: root,
          emitterName: "test-emitter",
        },
      );
      expect(result).toEqual({ success: true });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
