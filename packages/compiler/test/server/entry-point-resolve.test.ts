import { afterEach, describe, expect, it, vi } from "vitest";
import { NodeSystemHost } from "../../src/core/node-system-host.js";
import { getDirectoryPath, joinPaths } from "../../src/core/path-utils.js";
import { resolveEntrypointFile } from "../../src/server/entrypoint-resolver.js";
import type { ServerLog } from "../../src/server/types.js";

describe("compiler: server: resolveEntrypointFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function createLogger() {
    const logs: ServerLog[] = [];
    const log = (l: ServerLog) => logs.push(l);
    return log;
  }

  it("returns client-provided entrypoint in current directory", async () => {
    const cwd = "/ws/project";
    const filePath = joinPaths(cwd, "src", "doc.tsp");
    const expected = joinPaths(cwd, "custom.tsp");

    // Mock NodeSystemHost.stat to return isFile: true only for the expected path
    vi.spyOn(NodeSystemHost, "stat").mockImplementation(async (path) => {
      return path === expected ? ({ isFile: () => true } as any) : ({ isFile: () => false } as any);
    });

    // Mock readFile to handle package.json reads without throwing
    vi.spyOn(NodeSystemHost, "readFile").mockImplementation(async (path) => {
      if (path.endsWith("package.json")) {
        return { text: "{}" } as any;
      }
      throw new Error("File not found");
    });

    const log = createLogger();
    const result = await resolveEntrypointFile(
      NodeSystemHost,
      ["custom.tsp", "main.tsp"],
      cwd,
      log,
      filePath,
    );

    expect(result).toBe(expected);
  });

  it("finds client-provided entrypoint in parent directory when not in current", async () => {
    const root = "/repo";
    const sub = joinPaths(root, "pkg", "src");
    const filePath = joinPaths(sub, "file.tsp");
    const expected = joinPaths(root, "main.tsp");

    vi.spyOn(NodeSystemHost, "stat").mockImplementation(async (path) => {
      // Only the parent root with main.tsp exists
      return path === expected ? ({ isFile: () => true } as any) : ({ isFile: () => false } as any);
    });
    vi.spyOn(NodeSystemHost, "readFile").mockResolvedValue({ text: "{}" } as any);

    const log = createLogger();
    const result = await resolveEntrypointFile(
      NodeSystemHost,
      ["missing.tsp", "main.tsp"],
      sub,
      log,
      filePath,
    );
    expect(result).toBe(expected);
  });

  it("falls back to tspMain from package.json when no client entrypoints exist", async () => {
    const dir = "/lib";
    const filePath = joinPaths(dir, "src", "index.tsp");
    const pkgPath = joinPaths(dir, "package.json");
    const tspMain = "entry.tsp";
    const expected = joinPaths(dir, tspMain);

    vi.spyOn(NodeSystemHost, "stat").mockImplementation(async (path) => {
      return path === expected ? ({ isFile: () => true } as any) : ({ isFile: () => false } as any);
    });

    vi.spyOn(NodeSystemHost, "readFile").mockImplementation(async (path: string) => {
      // Provide tspMain only for the starting directory's package.json; others are empty
      const text = path === pkgPath ? JSON.stringify({ tspMain }) : "{}";
      return { text } as any;
    });

    const log = createLogger();
    const result = await resolveEntrypointFile(NodeSystemHost, undefined, dir, log, filePath);
    expect(result).toBe(expected);
  });

  it("uses the given path as main when nothing else is found", async () => {
    const filePath = "/standalone/file.tsp";
    const dir = getDirectoryPath(filePath);

    vi.spyOn(NodeSystemHost, "stat").mockImplementation(async () => {
      return { isFile: () => false } as any;
    });
    vi.spyOn(NodeSystemHost, "readFile").mockResolvedValue({ text: "{}" } as any);

    const log = createLogger();
    const result = await resolveEntrypointFile(NodeSystemHost, undefined, dir, log, filePath);
    expect(result).toBe(filePath);
  });
});
