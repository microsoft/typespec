import { mkdir, rm, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { beforeAll, describe, expect, it } from "vitest";
import { checkFilesFormat } from "../../src/core/formatter-fs.js";
import { resolvePath } from "../../src/core/path-utils.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureRoot = resolvePath(__dirname, "../../temp/test/formatter-fs");

const wellFormattedTsp = `model Foo {
  name: string;
}
`;
const unformattedTsp = `model 
  Foo {
  name: string;
}
`;

function fixturePath(...segments: string[]) {
  return join(fixtureRoot, ...segments);
}

async function createFixtureFile(relativePath: string, content = "") {
  const fullPath = fixturePath(relativePath);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, content);
}

function allFiles(result: Awaited<ReturnType<typeof checkFilesFormat>>): string[] {
  return [...result.formatted, ...result.needsFormat, ...result.ignored].sort();
}

beforeAll(async () => {
  await rm(fixtureRoot, { recursive: true, force: true });
  await mkdir(fixtureRoot, { recursive: true });

  await createFixtureFile("project/main.tsp", wellFormattedTsp);
  await createFixtureFile("project/lib.tsp", unformattedTsp);
  await createFixtureFile("project/sub/nested.tsp", wellFormattedTsp);
  await createFixtureFile("project/readme.md", "# Readme");
  await createFixtureFile("project/node_modules/dep/index.tsp", unformattedTsp);
  await createFixtureFile("project/excluded/skip.tsp", unformattedTsp);
});

describe("formatter-fs: findFiles", () => {
  it("finds .tsp files with explicit glob pattern", async () => {
    const result = await checkFilesFormat([fixturePath("project/**/*.tsp")], {});
    expect(allFiles(result)).toEqual([
      fixturePath("project/excluded/skip.tsp"),
      fixturePath("project/lib.tsp"),
      fixturePath("project/main.tsp"),
      fixturePath("project/sub/nested.tsp"),
    ]);
  });

  it("expands bare directory path to find files recursively", async () => {
    const result = await checkFilesFormat([fixturePath("project")], {});
    expect(allFiles(result)).toEqual([
      fixturePath("project/excluded/skip.tsp"),
      fixturePath("project/lib.tsp"),
      fixturePath("project/main.tsp"),
      fixturePath("project/readme.md"),
      fixturePath("project/sub/nested.tsp"),
    ]);
  });

  it("excludes node_modules automatically", async () => {
    const result = await checkFilesFormat([fixturePath("project/**/*.tsp")], {});
    expect(allFiles(result)).not.toContainEqual(expect.stringContaining("node_modules"));
  });

  it("excludes node_modules when using directory expansion", async () => {
    const result = await checkFilesFormat([fixturePath("project")], {});
    expect(allFiles(result)).not.toContainEqual(expect.stringContaining("node_modules"));
  });

  it("respects user-provided exclude patterns", async () => {
    const result = await checkFilesFormat([fixturePath("project/**/*.tsp")], {
      exclude: [fixturePath("project/excluded/**")],
    });
    expect(allFiles(result)).toEqual([
      fixturePath("project/lib.tsp"),
      fixturePath("project/main.tsp"),
      fixturePath("project/sub/nested.tsp"),
    ]);
  });

  it("handles multiple include patterns", async () => {
    const result = await checkFilesFormat(
      [fixturePath("project/main.tsp"), fixturePath("project/sub/**/*.tsp")],
      {},
    );
    expect(allFiles(result)).toEqual([
      fixturePath("project/main.tsp"),
      fixturePath("project/sub/nested.tsp"),
    ]);
  });

  it("classifies non-tsp files as ignored", async () => {
    const result = await checkFilesFormat([fixturePath("project/readme.md")], {});
    expect(result.ignored).toEqual([fixturePath("project/readme.md")]);
  });

  it("returns empty results when nothing matches", async () => {
    const result = await checkFilesFormat([fixturePath("project/**/*.py")], {});
    expect(allFiles(result)).toEqual([]);
  });

  it("correctly identifies formatted vs needs-format files", async () => {
    const result = await checkFilesFormat(
      [fixturePath("project/main.tsp"), fixturePath("project/lib.tsp")],
      {},
    );
    expect(result.formatted).toEqual([fixturePath("project/main.tsp")]);
    expect(result.needsFormat).toEqual([fixturePath("project/lib.tsp")]);
  });
});
