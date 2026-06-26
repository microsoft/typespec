import { describe, expect, it } from "vitest";
import {
  createPermissionedSystemHost,
  createPermissionSet,
  PermissionDeniedError,
} from "../../src/core/permissions/index.js";
import type { SystemHost } from "../../src/core/types.js";

/** A SystemHost that records calls and never touches the real file system. */
function createFakeHost(): SystemHost & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    readUrl: async (url) => {
      calls.push(`readUrl:${url}`);
      return {
        path: url,
        text: "",
        getLineStarts: () => [0],
        getLineAndCharacterOfPosition: () => ({ line: 0, character: 0 }),
      } as any;
    },
    readFile: async (path) => {
      calls.push(`readFile:${path}`);
      return {
        path,
        text: "",
        getLineStarts: () => [0],
        getLineAndCharacterOfPosition: () => ({ line: 0, character: 0 }),
      } as any;
    },
    writeFile: async (path) => {
      calls.push(`writeFile:${path}`);
    },
    readDir: async (path) => {
      calls.push(`readDir:${path}`);
      return [];
    },
    rm: async (path) => {
      calls.push(`rm:${path}`);
    },
    mkdirp: async (path) => {
      calls.push(`mkdirp:${path}`);
      return path;
    },
    stat: async (path) => {
      calls.push(`stat:${path}`);
      return { isDirectory: () => false, isFile: () => true };
    },
    realpath: async (path) => {
      calls.push(`realpath:${path}`);
      return path;
    },
  };
}

describe("createPermissionedSystemHost", () => {
  const permissions = createPermissionSet([
    { kind: "fs-read", paths: ["/project/src"] },
    { kind: "fs-write", paths: ["/project/out"] },
    { kind: "network", hosts: ["*.example.com"] },
  ]);

  it("allows reads within granted scope and forwards to the inner host", async () => {
    const fake = createFakeHost();
    const host = createPermissionedSystemHost(fake, permissions);
    await host.readFile("/project/src/main.tsp");
    expect(fake.calls).toContain("readFile:/project/src/main.tsp");
  });

  it("denies reads outside granted scope", async () => {
    const host = createPermissionedSystemHost(createFakeHost(), permissions);
    await expect(host.readFile("/etc/hosts")).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it("allows writes within the output scope but denies writes elsewhere", async () => {
    const fake = createFakeHost();
    const host = createPermissionedSystemHost(fake, permissions);
    await host.writeFile("/project/out/openapi.yaml", "x");
    expect(fake.calls).toContain("writeFile:/project/out/openapi.yaml");
    await expect(host.writeFile("/project/src/leak.ts", "x")).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
  });

  it("denies removing or creating directories outside the write scope", async () => {
    const host = createPermissionedSystemHost(createFakeHost(), permissions);
    await expect(host.rm("/project/src")).rejects.toBeInstanceOf(PermissionDeniedError);
    await expect(host.mkdirp("/tmp/x")).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it("allows network reads to granted hosts and denies others", async () => {
    const fake = createFakeHost();
    const host = createPermissionedSystemHost(fake, permissions);
    await host.readUrl("https://api.example.com/schema.json");
    expect(fake.calls).toContain("readUrl:https://api.example.com/schema.json");
    await expect(host.readUrl("https://evil.test/x")).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it("treats a non-URL passed to readUrl as a file read", async () => {
    const host = createPermissionedSystemHost(createFakeHost(), permissions);
    await expect(host.readUrl("/etc/passwd")).rejects.toMatchObject({ permission: "fs-read" });
  });

  it("denies everything under the empty (default) permission set", async () => {
    const host = createPermissionedSystemHost(createFakeHost(), createPermissionSet([]));
    await expect(host.readFile("/project/src/main.tsp")).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
    await expect(host.writeFile("/project/out/x", "y")).rejects.toBeInstanceOf(
      PermissionDeniedError,
    );
  });

  it("exposes the denial code and resource for diagnostics", async () => {
    const host = createPermissionedSystemHost(createFakeHost(), permissions);
    await expect(host.writeFile("/nope/x", "y")).rejects.toMatchObject({
      code: "ERR_ACCESS_DENIED",
      permission: "fs-write",
      resource: "/nope/x",
    });
  });
});
