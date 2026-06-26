import { describe, expect, it } from "vitest";
import {
  buildSandboxEnv,
  createPermissionSet,
  permissionSetToNodeArgs,
} from "../../../src/core/permissions/index.js";

describe("permissionSetToNodeArgs", () => {
  it("always enables the permission model and denies everything by default", () => {
    const args = permissionSetToNodeArgs(createPermissionSet([]));
    expect(args).toEqual(["--permission"]);
  });

  it("emits fs-read/fs-write flags for granted scopes and essential scopes", () => {
    const args = permissionSetToNodeArgs(
      createPermissionSet([
        { kind: "fs-read", paths: ["/project/src"] },
        { kind: "fs-write", paths: ["/project/out"] },
      ]),
      { essentialReadScopes: ["/compiler"], essentialWriteScopes: ["/tmp/work"] },
    );
    expect(args).toContain("--allow-fs-read=/compiler");
    expect(args).toContain("--allow-fs-read=/project/src");
    expect(args).toContain("--allow-fs-write=/tmp/work");
    expect(args).toContain("--allow-fs-write=/project/out");
  });

  it("enables child processes when exec is granted (true or a command list)", () => {
    expect(permissionSetToNodeArgs(createPermissionSet([{ kind: "exec" }]))).toContain(
      "--allow-child-process",
    );
    expect(
      permissionSetToNodeArgs(createPermissionSet([{ kind: "exec", commands: ["git"] }])),
    ).toContain("--allow-child-process");
  });

  it("does not produce flags for network or env (not covered by the permission model)", () => {
    const args = permissionSetToNodeArgs(
      createPermissionSet([
        { kind: "network", hosts: ["*"] },
        { kind: "env", names: ["TOKEN"] },
      ]),
    );
    expect(args).toEqual(["--permission"]);
  });
});

describe("buildSandboxEnv", () => {
  const parentEnv = {
    PATH: "/usr/bin",
    HOME: "/home/me",
    SECRET_TOKEN: "leak",
    MY_VAR: "ok",
  };

  it("forwards only essential vars plus granted env names", () => {
    const env = buildSandboxEnv(createPermissionSet([{ kind: "env", names: ["MY_VAR"] }]), parentEnv);
    expect(env.PATH).toBe("/usr/bin");
    expect(env.HOME).toBe("/home/me");
    expect(env.MY_VAR).toBe("ok");
    expect(env.SECRET_TOKEN).toBeUndefined();
  });

  it("drops everything but essentials when no env is granted", () => {
    const env = buildSandboxEnv(createPermissionSet([]), parentEnv);
    expect(env.SECRET_TOKEN).toBeUndefined();
    expect(env.MY_VAR).toBeUndefined();
    expect(env.PATH).toBe("/usr/bin");
  });
});
