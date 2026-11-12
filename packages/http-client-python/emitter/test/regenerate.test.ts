import { mkdtemp, readdir, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  buildTaskGroups,
  compileSpec,
  type RegenerateContext,
} from "../../eng/scripts/ci/regenerate-common.js";

describe("typespec-python: regeneration configuration", () => {
  let directory: string;
  let ctx: RegenerateContext;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "python-regenerate-test-"));
    const emitter = join(directory, "emitter.mjs");
    await writeFile(
      emitter,
      `
      export const $lib = { name: "regeneration-test" };
      export async function $onEmit(context) {
        await context.program.host.mkdirp(context.emitterOutputDir);
        await context.program.host.writeFile(
          context.emitterOutputDir + "/options.json",
          JSON.stringify(context.options),
        );
      }
      `,
    );
    ctx = {
      pluginDir: emitter,
      emitterName: "regeneration-test",
      azureHttpSpecs: directory,
      httpSpecs: directory,
      generatedFolder: directory,
    };
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it.each([
    {
      feature: "union-extends",
      source: "model Base {} model Cat extends Base {} union Pet extends Base { cat: Cat }",
    },
    {
      feature: "typeref",
      source: "model Item {} const reference: TypeRef = typeref(Item);",
    },
  ])("loads the $feature feature and merges emitter overrides", async ({ feature, source }) => {
    const spec = join(directory, "main.tsp");
    const outputDir = join(directory, "output");
    await writeFile(spec, source);
    await writeFile(
      join(directory, "tspconfig.yaml"),
      `
kind: project
features:
  - ${feature}
options:
  regeneration-test:
    from-config: true
    override: configured
`,
    );

    const result = await compileSpec(
      {
        spec,
        outputDir,
        options: { "emitter-output-dir": outputDir, override: "task" },
      },
      ctx,
    );

    expect(result).toEqual({ success: true });
    expect(JSON.parse(await readFile(join(outputDir, "options.json"), "utf8"))).toEqual({
      "from-config": true,
      override: "task",
    });
  });

  it("reports invalid scenario configuration before emitting", async () => {
    const spec = join(directory, "main.tsp");
    const outputDir = join(directory, "output");
    await writeFile(spec, "model Item {}");
    await writeFile(join(directory, "tspconfig.yaml"), "kind: project\nfeatures: true\n");

    const result = await compileSpec(
      { spec, outputDir, options: { "emitter-output-dir": outputDir } },
      ctx,
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("features");
    await expect(readFile(join(outputDir, "options.json"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("generates a valid package name for Azure authentication configurations", async () => {
    const pluginDir = resolve(import.meta.dirname, "../..");
    const realContext = {
      ...ctx,
      pluginDir,
      emitterName: "@typespec/http-client-python",
      azureHttpSpecs: join(pluginDir, "node_modules/@azure-tools/azure-http-specs/specs"),
      httpSpecs: join(pluginDir, "node_modules/@typespec/http-specs/specs"),
    };
    const spec = join(
      realContext.azureHttpSpecs,
      "azure/core/authentication/configurations/main.tsp",
    );
    const [group] = buildTaskGroups([spec], { flavor: "azure", debug: false }, realContext, {
      emitYamlOnly: true,
    });
    const outputDir = join(directory, "output");
    const task = group.tasks[0];
    task.outputDir = outputDir;
    task.options["emitter-output-dir"] = outputDir;
    let yamlPath: string | undefined;

    try {
      expect(await compileSpec(task, realContext)).toEqual({ success: true });
      const pointer = (await readdir(outputDir)).find((name) => name.startsWith(".tsp-codegen-"));
      const config = JSON.parse(await readFile(join(outputDir, pointer!), "utf8"));
      yamlPath = config.yamlPath;
      expect(config.commandArgs["package-name"]).toMatch(
        /^[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$/,
      );
    } finally {
      if (yamlPath) {
        await rm(yamlPath, { force: true });
      }
    }
  }, 60_000);
});
