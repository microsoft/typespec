import { findTestPackageRoot } from "@typespec/compiler/testing";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { loadSampleCatalog } from "../src/sample-config.js";

describe("sample config", () => {
  it("loads the canonical playground samples in configured order", async () => {
    const packageRoot = await findTestPackageRoot(import.meta.url);
    const catalog = await loadSampleCatalog(resolve(packageRoot, "specs"));

    expect(catalog.samples.filter((x) => x.playground).map((x) => x.config.title)).toEqual([
      "HTTP service",
      "REST framework",
      "API versioning",
      "Discriminated unions",
      "Protobuf kiosk",
      "JSON Schema",
      "GraphQL",
    ]);
  });

  it("inherits playground exclusions from directory configs", async () => {
    await withTempCatalog(
      {
        "legacy/sample-config.yaml": "directory: true\nplayground: false\n",
        "legacy/widget/sample-config.yaml": "title: Legacy widget\ndescription: A legacy sample.\n",
        "legacy/widget/main.tsp": "model Widget {}",
      },
      async (root) => {
        const catalog = await loadSampleCatalog(root);
        expect(catalog.samples[0].playground).toBe(false);
      },
    );
  });

  it("reports missing required metadata", async () => {
    await withTempCatalog(
      {
        "widget/sample-config.yaml": "title: Widget\n",
        "widget/main.tsp": "model Widget {}",
      },
      async (root) => {
        await expect(loadSampleCatalog(root)).rejects.toThrow(
          'requires a non-empty "description" field',
        );
      },
    );
  });

  it("reports samples without metadata", async () => {
    await withTempCatalog({ "widget/main.tsp": "model Widget {}" }, async (root) => {
      await expect(loadSampleCatalog(root)).rejects.toThrow("is missing sample-config.yaml");
    });
  });

  it("reports duplicate sample titles", async () => {
    await withTempCatalog(
      {
        "one/sample-config.yaml": "title: Widget\ndescription: First sample.\n",
        "one/main.tsp": "model One {}",
        "two/sample-config.yaml": "title: Widget\ndescription: Second sample.\n",
        "two/main.tsp": "model Two {}",
      },
      async (root) => {
        await expect(loadSampleCatalog(root)).rejects.toThrow('has duplicate title "Widget"');
      },
    );
  });

  it("reports malformed and unknown metadata", async () => {
    await withTempCatalog(
      {
        "widget/sample-config.yaml":
          "title: Widget\ndescription: A widget sample.\nplaygrond: true\n",
        "widget/main.tsp": "model Widget {}",
      },
      async (root) => {
        await expect(loadSampleCatalog(root)).rejects.toThrow('unknown field "playgrond"');
      },
    );
  });

  it("reports metadata without a sample entrypoint", async () => {
    await withTempCatalog(
      {
        "widget/sample-config.yaml": "title: Widget\ndescription: A widget sample.\n",
      },
      async (root) => {
        await expect(loadSampleCatalog(root)).rejects.toThrow(
          "must contain main.tsp or a package.json TypeSpec entrypoint",
        );
      },
    );
  });
});

async function withTempCatalog(
  files: Record<string, string>,
  callback: (root: string) => Promise<void>,
): Promise<void> {
  const root = await mkdtemp(resolve(tmpdir(), "typespec-samples-"));
  try {
    for (const [name, content] of Object.entries(files)) {
      const path = resolve(root, name);
      await mkdir(resolve(path, ".."), { recursive: true });
      await writeFile(path, content);
    }
    await callback(root);
  } finally {
    await rm(root, { recursive: true });
  }
}
