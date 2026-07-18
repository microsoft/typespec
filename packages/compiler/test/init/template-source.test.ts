import { beforeEach, describe, expect, it } from "vitest";
import { resolvePath } from "../../src/core/path-utils.js";
import type { CompilerHost } from "../../src/core/types.js";
import {
  FileSystemTemplateSource,
  InMemoryTemplateSource,
  RemoteTemplateSource,
} from "../../src/init/template-source/index.js";
import { createTestFileSystem } from "../../src/testing/fs.js";
import type { TestFileSystem } from "../../src/testing/types.js";

const scaffolding = {
  sample: { title: "Sample", description: "A sample template", files: [] },
};

describe("FileSystemTemplateSource", () => {
  let testFs: TestFileSystem;
  const root = resolvePath("/root/templates");

  beforeEach(async () => {
    testFs = await createTestFileSystem();
    testFs.fs.set(resolvePath(root, "scaffolding.json"), JSON.stringify(scaffolding));
    testFs.fs.set(resolvePath(root, "sample", "main.tsp"), "op ping(): void;");
  });

  it("loads the index from scaffolding.json", async () => {
    const source = new FileSystemTemplateSource(testFs.compilerHost, root);
    const index = await source.loadIndex();
    expect(index.templates.sample.title).toBe("Sample");
    expect(index.baseUri).toBe(root);
  });

  it("reads template files relative to the root", async () => {
    const source = new FileSystemTemplateSource(testFs.compilerHost, root);
    const file = await source.readFile("sample/main.tsp");
    expect(file.text).toBe("op ping(): void;");
  });
});

describe("InMemoryTemplateSource", () => {
  const files = {
    "scaffolding.json": JSON.stringify(scaffolding),
    "sample/main.tsp": "op ping(): void;",
  };

  it("loads the index from the in-memory map", async () => {
    const source = new InMemoryTemplateSource(files);
    const index = await source.loadIndex();
    expect(index.templates.sample.title).toBe("Sample");
  });

  it("reads template files from the map, ignoring leading ./", async () => {
    const source = new InMemoryTemplateSource(files);
    const file = await source.readFile("./sample/main.tsp");
    expect(file.text).toBe("op ping(): void;");
  });

  it("throws ENOENT for a missing file", async () => {
    const source = new InMemoryTemplateSource(files);
    await expect(source.readFile("does/not/exist.tsp")).rejects.toMatchObject({ code: "ENOENT" });
  });
});

describe("RemoteTemplateSource", () => {
  it("resolves template files relative to the index URL", async () => {
    const reads: string[] = [];
    const host = {
      readUrl: async (url: string) => {
        reads.push(url);
        return { path: url, text: url.endsWith("index.json") ? JSON.stringify(scaffolding) : "hi" };
      },
    } as unknown as CompilerHost;

    const source = new RemoteTemplateSource(host, "https://example.com/tpl/index.json");
    const index = await source.loadIndex();
    expect(index.templates.sample.title).toBe("Sample");

    await source.readFile("sample/main.tsp");
    expect(reads).toContain("https://example.com/tpl/sample/main.tsp");
  });
});
