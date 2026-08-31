import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildPlaygroundSamples } from "../src/build-playground-samples.js";

describe("build playground samples", () => {
  it("derives categories, emitters, and linter options", async () => {
    await withTempDirectory(async (root) => {
      await writeFiles(root, {
        "specs/http/sample-config.yaml": "directory: true\nlabel: HTTP\n",
        "specs/http/widgets/sample-config.yaml": "title: Widgets\ndescription: A widget service.\n",
        "specs/http/widgets/main.tsp": "model Widget {}",
        "specs/http/base.yaml":
          'emit:\n  - "@typespec/openapi3"\nlinter:\n  extends:\n    - "@typespec/http/all"\n',
        "specs/http/widgets/tspconfig.yaml": "extends: ../base.yaml\n",
      });

      const outputFile = resolve(root, "generated/samples.ts");
      const samples = await buildPlaygroundSamples({
        specsDir: resolve(root, "specs"),
        outputFile,
        relativeTo: root,
      });

      expect(samples.Widgets).toMatchObject({
        filename: "specs/http/widgets/main.tsp",
        preferredEmitter: "@typespec/openapi3",
        category: "HTTP",
        description: "A widget service.",
        compilerOptions: { linterRuleSet: { extends: ["@typespec/http/all"] } },
      });
      expect(await readFile(outputFile, "utf-8")).toContain(
        "const samples: Record<string, PlaygroundSample>",
      );
    });
  });

  it("uses the default emitter when the sample has no emitter config", async () => {
    await withTempDirectory(async (root) => {
      await writeFiles(root, {
        "specs/widgets/sample-config.yaml": "title: Widgets\ndescription: A widget service.\n",
        "specs/widgets/main.tsp": "model Widget {}",
      });

      const samples = await buildPlaygroundSamples({
        specsDir: resolve(root, "specs"),
        outputFile: resolve(root, "generated/samples.ts"),
        relativeTo: root,
        defaultEmitter: "@typespec/openapi3",
      });

      expect(samples.Widgets.preferredEmitter).toBe("@typespec/openapi3");
    });
  });

  it("rejects samples without a configured or default emitter", async () => {
    await withTempDirectory(async (root) => {
      await writeFiles(root, {
        "specs/widgets/sample-config.yaml": "title: Widgets\ndescription: A widget service.\n",
        "specs/widgets/main.tsp": "model Widget {}",
      });

      await expect(
        buildPlaygroundSamples({
          specsDir: resolve(root, "specs"),
          outputFile: resolve(root, "generated/samples.ts"),
          relativeTo: root,
        }),
      ).rejects.toThrow('Playground sample "widgets" has no emitter');
    });
  });

  it("rejects eligible multi-file samples", async () => {
    await withTempDirectory(async (root) => {
      await writeFiles(root, {
        "specs/widgets/sample-config.yaml": "title: Widgets\ndescription: A widget service.\n",
        "specs/widgets/main.tsp": 'import "./models.tsp";',
        "specs/widgets/models.tsp": "model Widget {}",
      });

      await expect(
        buildPlaygroundSamples({
          specsDir: resolve(root, "specs"),
          outputFile: resolve(root, "generated/samples.ts"),
          relativeTo: root,
          defaultEmitter: "@typespec/openapi3",
        }),
      ).rejects.toThrow("must contain exactly one TypeSpec file named main.tsp");
    });
  });
});

async function withTempDirectory(callback: (root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(resolve(tmpdir(), "typespec-playground-samples-"));
  try {
    await callback(root);
  } finally {
    await rm(root, { recursive: true });
  }
}

async function writeFiles(root: string, files: Record<string, string>): Promise<void> {
  for (const [name, content] of Object.entries(files)) {
    const path = resolve(root, name);
    await mkdir(resolve(path, ".."), { recursive: true });
    await writeFile(path, content);
  }
}
