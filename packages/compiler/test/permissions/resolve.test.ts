import { describe, expect, it } from "vitest";
import type { PermissionRequest } from "../../src/core/permissions/index.js";
import {
  configGrantToPermissionSet,
  formatGrantSuggestion,
  manifestToPermissionSet,
  resolvePermissions,
} from "../../src/core/permissions/index.js";

describe("manifestToPermissionSet", () => {
  it("collects requested permissions, ignoring reasons", () => {
    const requests: PermissionRequest[] = [
      { permission: { kind: "fs-read", paths: ["/a"] }, reason: "read templates" },
      { permission: { kind: "network", hosts: ["api.example.com"] } },
    ];
    const set = manifestToPermissionSet(requests);
    expect(set.fsRead).toEqual(["/a"]);
    expect(set.network).toEqual(["api.example.com"]);
  });

  it("returns an empty set when there are no requests", () => {
    expect(manifestToPermissionSet(undefined).fsRead).toEqual([]);
  });
});

describe("configGrantToPermissionSet", () => {
  it("resolves relative paths against the base dir and always grants the output dir for writes", () => {
    const set = configGrantToPermissionSet(
      { "fs-read": ["./schemas"], "fs-write": ["./extra"] },
      { baseDir: "/project", outputDir: "/project/tsp-output" },
    );
    expect(set.fsRead).toEqual(["/project/schemas"]);
    expect(set.fsWrite).toEqual(["/project/extra", "/project/tsp-output"]);
  });

  it("grants the output dir for writes even with no explicit grant", () => {
    const set = configGrantToPermissionSet(undefined, {
      baseDir: "/project",
      outputDir: "/project/out",
    });
    expect(set.fsWrite).toEqual(["/project/out"]);
  });

  it("maps exec: true to any-command", () => {
    const set = configGrantToPermissionSet({ exec: true }, { baseDir: "/project" });
    expect(set.exec).toBe(true);
  });
});

describe("resolvePermissions", () => {
  it("authorizes when the grant covers every request", () => {
    const requests: PermissionRequest[] = [
      { permission: { kind: "fs-read", paths: ["/project/schemas"] } },
      { permission: { kind: "fs-write", paths: ["/project/tsp-output/openapi"] } },
    ];
    const res = resolvePermissions(
      requests,
      { "fs-read": ["./schemas"] },
      { baseDir: "/project", outputDir: "/project/tsp-output" },
    );
    expect(res.missing).toEqual([]);
    expect(res.effective.fsRead).toEqual(["/project/schemas"]);
    // The emitter's output dir is always writable (implicit grant), in addition
    // to the intersection of requested and granted write scopes.
    expect(res.effective.fsWrite).toEqual(["/project/tsp-output/openapi", "/project/tsp-output"]);
  });

  it("reports missing permissions when the grant is insufficient", () => {
    const requests: PermissionRequest[] = [
      { permission: { kind: "fs-read", paths: ["/etc"] } },
      { permission: { kind: "network", hosts: ["api.example.com"] } },
    ];
    const res = resolvePermissions(requests, undefined, {
      baseDir: "/project",
      outputDir: "/project/out",
    });
    expect(res.missing).toEqual([
      { kind: "fs-read", paths: ["/etc"] },
      { kind: "network", hosts: ["api.example.com"] },
    ]);
  });

  it("grants nothing system-related by default (secure default)", () => {
    const requests: PermissionRequest[] = [
      { permission: { kind: "exec" } },
      { permission: { kind: "env", names: ["TOKEN"] } },
    ];
    const res = resolvePermissions(requests, undefined, { baseDir: "/project" });
    expect(res.effective.exec).toBe(false);
    expect(res.effective.env).toEqual([]);
    expect(res.missing).toEqual([{ kind: "env", names: ["TOKEN"] }, { kind: "exec" }]);
  });

  it("always makes the output dir writable, even with no requested permissions", () => {
    // A plain emitter that declares no permissions must still be able to write
    // its own output directory.
    const res = resolvePermissions(undefined, undefined, {
      baseDir: "/project",
      outputDir: "/project/tsp-output/plain",
    });
    expect(res.missing).toEqual([]);
    expect(res.effective.fsWrite).toEqual(["/project/tsp-output/plain"]);
  });
});

describe("formatGrantSuggestion", () => {
  it("renders a pasteable tspconfig snippet", () => {
    const snippet = formatGrantSuggestion("@typespec/openapi3", [
      { kind: "fs-read", paths: ["/etc"] },
      { kind: "network", hosts: ["api.example.com"] },
      { kind: "exec" },
    ]);
    expect(snippet).toBe(
      [
        "permissions:",
        '  "@typespec/openapi3":',
        "    fs-read:",
        "      - /etc",
        "    network:",
        "      - api.example.com",
        "    exec: true",
      ].join("\n"),
    );
  });
});
