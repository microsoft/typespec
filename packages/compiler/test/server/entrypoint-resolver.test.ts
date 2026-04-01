import { afterEach, describe, expect, it, vi } from "vitest";
import { joinPaths } from "../../src/core/path-utils.js";
import type { SystemHost } from "../../src/core/types.js";
import { resolveEntrypointFile } from "../../src/server/entrypoint-resolver.js";
import type { ServerLog } from "../../src/server/types.js";

afterEach(() => {
  vi.restoreAllMocks();
});

function createLogger() {
  const logs: ServerLog[] = [];
  const log = (l: ServerLog) => logs.push(l);
  return { log, logs };
}

function createMockHost(): SystemHost {
  return {
    readFile: vi.fn(),
    stat: vi.fn(),
  } as any;
}

it("returns client-provided entrypoint in current directory", async () => {
  const host = createMockHost();
  const cwd = "/ws/project";
  const filePath = joinPaths(cwd, "src", "doc.tsp");
  const expected = joinPaths(cwd, "custom.tsp");

  // Mock host.stat to return isFile: true only for the expected path
  vi.mocked(host.stat).mockImplementation(async (path) => {
    return path === expected ? ({ isFile: () => true } as any) : ({ isFile: () => false } as any);
  });

  // Mock host.readFile to handle package.json reads
  vi.mocked(host.readFile).mockImplementation(async (path) => {
    if (path.endsWith("package.json")) {
      return { text: "{}" } as any;
    }
    throw new Error("File not found");
  });

  const { log } = createLogger();
  const result = await resolveEntrypointFile(
    host,
    ["custom.tsp", "main.tsp"],
    filePath,
    undefined,
    log,
  );

  expect(result).toBe(expected);
});

it("finds client-provided entrypoint in parent directory when not in current", async () => {
  const host = createMockHost();
  const root = "/repo";
  const sub = joinPaths(root, "pkg", "src");
  const filePath = joinPaths(sub, "file.tsp");
  const expected = joinPaths(root, "main.tsp");

  vi.mocked(host.stat).mockImplementation(async (path) => {
    // Only the parent root with main.tsp exists
    return path === expected ? ({ isFile: () => true } as any) : ({ isFile: () => false } as any);
  });
  vi.mocked(host.readFile).mockResolvedValue({ text: "{}" } as any);

  const { log } = createLogger();
  const result = await resolveEntrypointFile(
    host,
    ["missing.tsp", "main.tsp"],
    filePath,
    undefined,
    log,
  );
  expect(result).toBe(expected);
});

it("falls back to tspMain from package.json when no client entrypoints exist", async () => {
  const host = createMockHost();
  const dir = "/lib";
  const filePath = joinPaths(dir, "src", "index.tsp");
  const pkgPath = joinPaths(dir, "package.json");
  const tspMain = "entry.tsp";
  const expected = joinPaths(dir, tspMain);

  vi.mocked(host.stat).mockImplementation(async (path) => {
    return path === expected ? ({ isFile: () => true } as any) : ({ isFile: () => false } as any);
  });

  vi.mocked(host.readFile).mockImplementation(async (path: string) => {
    // Provide tspMain only for the starting directory's package.json; others are empty
    const text = path === pkgPath ? JSON.stringify({ tspMain }) : "{}";
    return { text } as any;
  });

  const { log } = createLogger();
  const result = await resolveEntrypointFile(host, undefined, filePath, undefined, log);
  expect(result).toBe(expected);
});

it("uses the given path as main when nothing else is found", async () => {
  const host = createMockHost();
  const filePath = "/standalone/file.tsp";

  vi.mocked(host.stat).mockImplementation(async (path) => {
    // The initial path should be treated as a file, but no other files exist
    return path === filePath ? ({ isFile: () => true } as any) : ({ isFile: () => false } as any);
  });
  vi.mocked(host.readFile).mockResolvedValue({ text: "{}" } as any);

  const { log } = createLogger();
  const result = await resolveEntrypointFile(host, undefined, filePath, undefined, log);
  expect(result).toBe(filePath);
});

it("uses main.tsp as default entrypoint when entrypoints is null or undefined and no package.json tspMain found", async () => {
  const host = createMockHost();
  const dir = "/project";
  const filePath = joinPaths(dir, "src", "file.tsp");
  const expectedMainTsp = joinPaths(dir, "main.tsp");

  // Mock host.stat to return isFile: true only for the expected main.tsp path
  vi.mocked(host.stat).mockImplementation(async (path) => {
    return path === expectedMainTsp
      ? ({ isFile: () => true } as any)
      : ({ isFile: () => false } as any);
  });

  // Mock host.readFile to return empty package.json (no tspMain)
  vi.mocked(host.readFile).mockImplementation(async (path) => {
    if (path.endsWith("package.json")) {
      return { text: "{}" } as any; // Empty package.json, no tspMain
    }
    throw new Error("File not found");
  });

  const { log } = createLogger();
  const resultForNull = await resolveEntrypointFile(
    host,
    null, // Explicitly pass null for entrypoints
    filePath,
    undefined,
    log,
  );

  expect(resultForNull).toBe(expectedMainTsp);

  const resultForUndefined = await resolveEntrypointFile(
    host,
    undefined, // Explicitly pass undefined for entrypoints
    filePath,
    undefined,
    log,
  );

  expect(resultForUndefined).toBe(expectedMainTsp);
});

describe("project tspconfig entrypoint resolution", () => {
  it("resolves entrypoint from project tspconfig.yaml with default main.tsp", async () => {
    const host = createMockHost();
    const dir = "/project";
    const filePath = joinPaths(dir, "src", "doc.tsp");
    const tspConfigPath = joinPaths(dir, "tspconfig.yaml");
    const expectedEntrypoint = joinPaths(dir, "main.tsp");

    vi.mocked(host.stat).mockImplementation(async (path) => {
      if (path === tspConfigPath) return { isFile: () => true } as any;
      return { isFile: () => false } as any;
    });

    vi.mocked(host.readFile).mockImplementation(async (path: string) => {
      if (path === tspConfigPath) {
        return { text: "project: true\n", path: tspConfigPath } as any;
      }
      if (path.endsWith("package.json")) {
        return { text: "{}", path } as any;
      }
      throw new Error("File not found");
    });

    const { log } = createLogger();
    const result = await resolveEntrypointFile(host, undefined, filePath, undefined, log);
    expect(result).toBe(expectedEntrypoint);
  });

  it("resolves entrypoint from project tspconfig.yaml with custom entrypoint", async () => {
    const host = createMockHost();
    const dir = "/project";
    const filePath = joinPaths(dir, "src", "doc.tsp");
    const tspConfigPath = joinPaths(dir, "tspconfig.yaml");
    const expectedEntrypoint = joinPaths(dir, "src/service.tsp");

    vi.mocked(host.stat).mockImplementation(async (path) => {
      if (path === tspConfigPath) return { isFile: () => true } as any;
      return { isFile: () => false } as any;
    });

    vi.mocked(host.readFile).mockImplementation(async (path: string) => {
      if (path === tspConfigPath) {
        return {
          text: "project:\n  entrypoint: src/service.tsp\n",
          path: tspConfigPath,
        } as any;
      }
      if (path.endsWith("package.json")) {
        return { text: "{}", path } as any;
      }
      throw new Error("File not found");
    });

    const { log } = createLogger();
    const result = await resolveEntrypointFile(host, undefined, filePath, undefined, log);
    expect(result).toBe(expectedEntrypoint);
  });

  it("project tspconfig takes priority over tspMain in package.json", async () => {
    const host = createMockHost();
    const dir = "/project";
    const filePath = joinPaths(dir, "src", "doc.tsp");
    const tspConfigPath = joinPaths(dir, "tspconfig.yaml");
    const expectedEntrypoint = joinPaths(dir, "main.tsp");

    vi.mocked(host.stat).mockImplementation(async (path) => {
      if (path === tspConfigPath) return { isFile: () => true } as any;
      if (path === joinPaths(dir, "other.tsp")) return { isFile: () => true } as any;
      return { isFile: () => false } as any;
    });

    vi.mocked(host.readFile).mockImplementation(async (path: string) => {
      if (path === tspConfigPath) {
        return { text: "project: true\n", path: tspConfigPath } as any;
      }
      if (path.endsWith("package.json")) {
        // package.json with tspMain pointing to a different file
        return { text: JSON.stringify({ tspMain: "other.tsp" }), path } as any;
      }
      throw new Error("File not found");
    });

    const { log } = createLogger();
    const result = await resolveEntrypointFile(host, undefined, filePath, undefined, log);
    // Should use project config's entrypoint (main.tsp) not tspMain (other.tsp)
    expect(result).toBe(expectedEntrypoint);
  });

  it("falls back to normal resolution when tspconfig has no project field", async () => {
    const host = createMockHost();
    const dir = "/project";
    const filePath = joinPaths(dir, "src", "doc.tsp");
    const tspConfigPath = joinPaths(dir, "tspconfig.yaml");
    const expectedEntrypoint = joinPaths(dir, "main.tsp");

    vi.mocked(host.stat).mockImplementation(async (path) => {
      if (path === tspConfigPath) return { isFile: () => true } as any;
      if (path === expectedEntrypoint) return { isFile: () => true } as any;
      return { isFile: () => false } as any;
    });

    vi.mocked(host.readFile).mockImplementation(async (path: string) => {
      if (path === tspConfigPath) {
        // No project field — just build config
        return { text: 'emit:\n  - "openapi"\n', path: tspConfigPath } as any;
      }
      if (path.endsWith("package.json")) {
        return { text: "{}", path } as any;
      }
      throw new Error("File not found");
    });

    const { log } = createLogger();
    const result = await resolveEntrypointFile(host, undefined, filePath, undefined, log);
    // Falls back to finding main.tsp via the normal entrypoint search
    expect(result).toBe(expectedEntrypoint);
  });
});
