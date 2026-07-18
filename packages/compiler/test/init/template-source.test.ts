import { beforeEach, describe, expect, it } from "vitest";
import { resolvePath } from "../../src/core/path-utils.js";
import type { CompilerHost } from "../../src/core/types.js";
import { InMemoryTemplateSource, UriTemplateSource } from "../../src/init/template-source/index.js";
import { createTestFileSystem } from "../../src/testing/fs.js";
import type { TestFileSystem } from "../../src/testing/types.js";

const scaffolding = {
  sample: { title: "Sample", description: "A sample template", files: [] },
};

describe("UriTemplateSource", () => {
  let testFs: TestFileSystem;
  const root = resolvePath("/root/templates");

  beforeEach(async () => {
    testFs = await createTestFileSystem();
    testFs.fs.set(resolvePath(root, "scaffolding.json"), JSON.stringify(scaffolding));
    testFs.fs.set(resolvePath(root, "sample", "main.tsp"), "op ping(): void;");
  });

  it("loads the index from the given index location", async () => {
    const source = new UriTemplateSource(
      testFs.compilerHost,
      resolvePath(root, "scaffolding.json"),
    );
    const index = await source.loadIndex();
    expect(index.templates.sample.title).toBe("Sample");
    expect(index.baseUri).toBe(root);
  });

  it("reads template files relative to the index directory", async () => {
    const source = new UriTemplateSource(
      testFs.compilerHost,
      resolvePath(root, "scaffolding.json"),
    );
    const file = await source.readFile("sample/main.tsp");
    expect(file.text).toBe("op ping(): void;");
  });

  it("fromDirectory resolves scaffolding.json at the directory root", async () => {
    const source = UriTemplateSource.fromDirectory(testFs.compilerHost, root);
    const index = await source.loadIndex();
    expect(index.templates.sample.title).toBe("Sample");
    expect((await source.readFile("sample/main.tsp")).text).toBe("op ping(): void;");
  });

  it("resolves remote template files relative to the index URL", async () => {
    const reads: string[] = [];
    const host = {
      readUrl: async (url: string) => {
        reads.push(url);
        return { path: url, text: url.endsWith("index.json") ? JSON.stringify(scaffolding) : "hi" };
      },
    } as unknown as CompilerHost;

    const source = new UriTemplateSource(host, "https://example.com/tpl/index.json");
    const index = await source.loadIndex();
    expect(index.templates.sample.title).toBe("Sample");

    await source.readFile("sample/main.tsp");
    expect(reads).toContain("https://example.com/tpl/sample/main.tsp");
  });
});

describe("InMemoryTemplateSource", () => {
  const files = new Map<string, string>([
    ["scaffolding.json", JSON.stringify(scaffolding)],
    ["sample/main.tsp", "op ping(): void;"],
  ]);

  it("loads the index from the in-memory bundle", async () => {
    const source = new InMemoryTemplateSource(files);
    const index = await source.loadIndex();
    expect(index.templates.sample.title).toBe("Sample");
    expect(index.baseUri).toBe("internal:");
  });

  it("reads template files from the in-memory bundle", async () => {
    const source = new InMemoryTemplateSource(files);
    expect((await source.readFile("sample/main.tsp")).text).toBe("op ping(): void;");
  });

  it("throws a helpful error for a missing file", async () => {
    const source = new InMemoryTemplateSource(files);
    await expect(source.readFile("missing.tsp")).rejects.toThrow(/missing\.tsp/);
  });
});
