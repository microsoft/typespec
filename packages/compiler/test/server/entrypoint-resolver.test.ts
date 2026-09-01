import { describe, expect, it } from "vitest";
import { resolveEntrypointFile } from "../../src/server/entrypoint-resolver.js";
import type { ServerLog } from "../../src/server/types.js";
import { createTestFileSystem, resolveVirtualPath } from "../../src/testing/index.js";

function createLogger() {
  const logs: ServerLog[] = [];
  const log = (l: ServerLog) => logs.push(l);
  return { log, logs };
}

async function resolveEntrypoint(
  files: Record<string, string>,
  path: string,
  entrypoints?: string[] | null,
): Promise<string | undefined> {
  const fs = createTestFileSystem();
  for (const [filePath, content] of Object.entries(files)) {
    fs.addTypeSpecFile(filePath, content);
  }
  const { log } = createLogger();
  return resolveEntrypointFile(
    fs.compilerHost,
    entrypoints,
    resolveVirtualPath(path),
    undefined,
    log,
  );
}

describe("entrypoint resolution", () => {
  it("returns client-provided entrypoint in current directory", async () => {
    const result = await resolveEntrypoint({ "project/custom.tsp": "" }, "project/src/doc.tsp", [
      "custom.tsp",
      "main.tsp",
    ]);
    expect(result).toBe(resolveVirtualPath("project/custom.tsp"));
  });

  it("finds client-provided entrypoint in parent directory when not in current", async () => {
    const result = await resolveEntrypoint({ "repo/main.tsp": "" }, "repo/pkg/src/file.tsp", [
      "missing.tsp",
      "main.tsp",
    ]);
    expect(result).toBe(resolveVirtualPath("repo/main.tsp"));
  });

  it("falls back to tspMain from package.json when no client entrypoints exist", async () => {
    const result = await resolveEntrypoint(
      {
        "lib/package.json": JSON.stringify({ tspMain: "entry.tsp" }),
        "lib/entry.tsp": "",
      },
      "lib/src/index.tsp",
    );
    expect(result).toBe(resolveVirtualPath("lib/entry.tsp"));
  });

  it("uses the given path as main when nothing else is found", async () => {
    const result = await resolveEntrypoint({ "standalone/file.tsp": "" }, "standalone/file.tsp");
    expect(result).toBe(resolveVirtualPath("standalone/file.tsp"));
  });

  it("uses main.tsp as default entrypoint when entrypoints is null or undefined", async () => {
    const files = { "project/main.tsp": "" };

    const resultForNull = await resolveEntrypoint(files, "project/src/file.tsp", null);
    expect(resultForNull).toBe(resolveVirtualPath("project/main.tsp"));

    const resultForUndefined = await resolveEntrypoint(files, "project/src/file.tsp", undefined);
    expect(resultForUndefined).toBe(resolveVirtualPath("project/main.tsp"));
  });
});

describe("project tspconfig entrypoint resolution", () => {
  it("uses project tspconfig entrypoint when kind is project", async () => {
    const result = await resolveEntrypoint(
      {
        "project/tspconfig.yaml": "kind: project\nentrypoint: main.tsp\n",
        "project/main.tsp": "",
      },
      "project/src/doc.tsp",
    );
    expect(result).toBe(resolveVirtualPath("project/main.tsp"));
  });

  it("uses custom entrypoint from project tspconfig", async () => {
    const result = await resolveEntrypoint(
      {
        "project/tspconfig.yaml": "kind: project\nentrypoint: src/service.tsp\n",
        "project/src/service.tsp": "",
      },
      "project/src/doc.tsp",
    );
    expect(result).toBe(resolveVirtualPath("project/src/service.tsp"));
  });

  it("defaults to main.tsp when kind is project but no entrypoint specified", async () => {
    const result = await resolveEntrypoint(
      {
        "project/tspconfig.yaml": "kind: project\n",
        "project/main.tsp": "",
      },
      "project/src/doc.tsp",
    );
    expect(result).toBe(resolveVirtualPath("project/main.tsp"));
  });

  it("project tspconfig stops the walk even if entrypoint file doesn't exist", async () => {
    const result = await resolveEntrypoint(
      {
        "project/tspconfig.yaml": "kind: project\nentrypoint: main.tsp\n",
        "project/src/doc.tsp": "", // file exists but entrypoint (main.tsp) doesn't
      },
      "project/src/doc.tsp",
    );
    // Falls back to the original file since entrypoint doesn't exist but boundary was found
    expect(result).toBe(resolveVirtualPath("project/src/doc.tsp"));
  });

  it("project tspconfig takes priority over package.json tspMain at same level", async () => {
    const result = await resolveEntrypoint(
      {
        "project/tspconfig.yaml": "kind: project\nentrypoint: main.tsp\n",
        "project/package.json": JSON.stringify({ tspMain: "lib/entry.tsp" }),
        "project/main.tsp": "",
        "project/lib/entry.tsp": "",
      },
      "project/src/doc.tsp",
    );
    expect(result).toBe(resolveVirtualPath("project/main.tsp"));
  });

  it("non-project tspconfig is ignored by entrypoint resolution", async () => {
    const result = await resolveEntrypoint(
      {
        "project/tspconfig.yaml": "emit:\n  - openapi\n",
        "project/main.tsp": "",
      },
      "project/src/doc.tsp",
    );
    // Should fall through to main.tsp since tspconfig is not a project
    expect(result).toBe(resolveVirtualPath("project/main.tsp"));
  });

  it("project tspconfig in parent dir is found by walk-up", async () => {
    const result = await resolveEntrypoint(
      {
        "project/tspconfig.yaml": "kind: project\nentrypoint: main.tsp\n",
        "project/main.tsp": "",
      },
      "project/src/deep/nested/file.tsp",
    );
    expect(result).toBe(resolveVirtualPath("project/main.tsp"));
  });

  it("nested project boundary prevents walk-up to parent project", async () => {
    const result = await resolveEntrypoint(
      {
        "repo/tspconfig.yaml": "kind: project\nentrypoint: main.tsp\n",
        "repo/main.tsp": "",
        "repo/services/orders/tspconfig.yaml": "kind: project\nentrypoint: main.tsp\n",
        "repo/services/orders/main.tsp": "",
      },
      "repo/services/orders/src/doc.tsp",
    );
    // Should resolve to the nested project, not the parent
    expect(result).toBe(resolveVirtualPath("repo/services/orders/main.tsp"));
  });
});
