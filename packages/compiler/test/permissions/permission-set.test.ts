import { describe, expect, it } from "vitest";
import type { Permission } from "../../src/core/permissions/index.js";
import {
  createPermissionSet,
  EMPTY_PERMISSION_SET,
  findMissingPermissions,
  formatPermission,
  intersectPermissionSets,
  isEmptyPermissionSet,
  isHostWithinScopes,
  isPathWithinScopes,
  mergePermissionSets,
} from "../../src/core/permissions/index.js";

describe("createPermissionSet", () => {
  it("aggregates granular permissions into a normalized set", () => {
    const set = createPermissionSet([
      { kind: "fs-read", paths: ["/a"] },
      { kind: "fs-read", paths: ["/b"] },
      { kind: "fs-write", paths: ["/out"] },
      { kind: "network", hosts: ["example.com"] },
      { kind: "env", names: ["TOKEN"] },
      { kind: "exec", commands: ["git"] },
    ]);
    expect(set.fsRead).toEqual(["/a", "/b"]);
    expect(set.fsWrite).toEqual(["/out"]);
    expect(set.network).toEqual(["example.com"]);
    expect(set.env).toEqual(["TOKEN"]);
    expect(set.exec).toEqual(["git"]);
  });

  it("treats exec without commands as allowing any command", () => {
    const set = createPermissionSet([{ kind: "exec", commands: ["git"] }, { kind: "exec" }]);
    expect(set.exec).toBe(true);
  });

  it("an empty list produces an empty set", () => {
    expect(isEmptyPermissionSet(createPermissionSet([]))).toBe(true);
    expect(isEmptyPermissionSet(EMPTY_PERMISSION_SET)).toBe(true);
  });
});

describe("isPathWithinScopes", () => {
  it("grants a directory and everything beneath it", () => {
    expect(isPathWithinScopes("/project/out/file.ts", ["/project/out"])).toBe(true);
    expect(isPathWithinScopes("/project/out", ["/project/out"])).toBe(true);
  });

  it("denies paths outside the scope", () => {
    expect(isPathWithinScopes("/etc/hosts", ["/project/out"])).toBe(false);
    expect(isPathWithinScopes("/project/other", ["/project/out"])).toBe(false);
  });

  it("normalizes '..' segments to prevent escape", () => {
    expect(isPathWithinScopes("/project/out/../../etc/hosts", ["/project/out"])).toBe(false);
  });

  it("denies everything when there are no scopes", () => {
    expect(isPathWithinScopes("/anything", [])).toBe(false);
  });
});

describe("isHostWithinScopes", () => {
  it("matches exact host names case-insensitively", () => {
    expect(isHostWithinScopes("Example.com", ["example.com"])).toBe(true);
    expect(isHostWithinScopes("other.com", ["example.com"])).toBe(false);
  });

  it("supports the '*' wildcard for any host", () => {
    expect(isHostWithinScopes("anything.dev", ["*"])).toBe(true);
  });

  it("supports sub-domain wildcards including the apex", () => {
    expect(isHostWithinScopes("api.example.com", ["*.example.com"])).toBe(true);
    expect(isHostWithinScopes("example.com", ["*.example.com"])).toBe(true);
    expect(isHostWithinScopes("example.org", ["*.example.com"])).toBe(false);
  });
});

describe("mergePermissionSets", () => {
  it("unions scopes and widens exec", () => {
    const a = createPermissionSet([
      { kind: "fs-read", paths: ["/a"] },
      { kind: "exec", commands: ["git"] },
    ]);
    const b = createPermissionSet([{ kind: "fs-read", paths: ["/b"] }, { kind: "exec" }]);
    const merged = mergePermissionSets(a, b);
    expect([...merged.fsRead].sort()).toEqual(["/a", "/b"]);
    expect(merged.exec).toBe(true);
  });
});

describe("intersectPermissionSets", () => {
  it("only keeps requested permissions that are granted", () => {
    const requested = createPermissionSet([
      { kind: "fs-read", paths: ["/project/src", "/etc"] },
      { kind: "fs-write", paths: ["/project/out"] },
      { kind: "network", hosts: ["api.example.com"] },
      { kind: "env", names: ["TOKEN", "SECRET"] },
      { kind: "exec", commands: ["git", "rm"] },
    ]);
    const granted = createPermissionSet([
      { kind: "fs-read", paths: ["/project"] },
      { kind: "fs-write", paths: ["/project/out"] },
      { kind: "network", hosts: ["*.example.com"] },
      { kind: "env", names: ["TOKEN"] },
      { kind: "exec", commands: ["git"] },
    ]);
    const effective = intersectPermissionSets(requested, granted);
    expect(effective.fsRead).toEqual(["/project/src"]);
    expect(effective.fsWrite).toEqual(["/project/out"]);
    expect(effective.network).toEqual(["api.example.com"]);
    expect(effective.env).toEqual(["TOKEN"]);
    expect(effective.exec).toEqual(["git"]);
  });

  it("grants nothing when nothing is approved", () => {
    const requested = createPermissionSet([{ kind: "fs-read", paths: ["/a"] }]);
    const effective = intersectPermissionSets(requested, EMPTY_PERMISSION_SET);
    expect(isEmptyPermissionSet(effective)).toBe(true);
  });
});

describe("findMissingPermissions", () => {
  it("reports exactly the requested permissions that were not granted", () => {
    const requested = createPermissionSet([
      { kind: "fs-read", paths: ["/project/src", "/etc"] },
      { kind: "network", hosts: ["api.example.com"] },
      { kind: "env", names: ["SECRET"] },
      { kind: "exec" },
    ]);
    const granted = createPermissionSet([
      { kind: "fs-read", paths: ["/project"] },
      { kind: "network", hosts: ["api.example.com"] },
    ]);
    const missing = findMissingPermissions(requested, granted);
    expect(missing).toEqual<Permission[]>([
      { kind: "fs-read", paths: ["/etc"] },
      { kind: "env", names: ["SECRET"] },
      { kind: "exec" },
    ]);
  });

  it("returns nothing when everything is granted", () => {
    const requested = createPermissionSet([{ kind: "fs-write", paths: ["/out/a"] }]);
    const granted = createPermissionSet([{ kind: "fs-write", paths: ["/out"] }]);
    expect(findMissingPermissions(requested, granted)).toEqual([]);
  });
});

describe("formatPermission", () => {
  it("renders each kind for diagnostics", () => {
    expect(formatPermission({ kind: "fs-read", paths: ["/a", "/b"] })).toBe("fs-read(/a, /b)");
    expect(formatPermission({ kind: "exec" })).toBe("exec");
    expect(formatPermission({ kind: "exec", commands: ["git"] })).toBe("exec(git)");
    expect(formatPermission({ kind: "network", hosts: ["*"] })).toBe("network(*)");
  });
});
