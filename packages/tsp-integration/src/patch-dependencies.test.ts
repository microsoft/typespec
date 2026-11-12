import { execa } from "execa";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "pathe";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parse } from "yaml";
import type { Packages } from "./find-packages.js";
import {
  discardDependencyPatch,
  patchDependencies,
  restoreDependencies,
} from "./patch-dependencies.js";

let dir: string;
let packages: Packages;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "tsp-integration-patch-"));
  await execa("git", ["init", "--quiet", dir]);
  await mkdir(join(dir, "local packages"));
  await mkdir(join(dir, "local packages", "compiler"));
  await writeFile(join(dir, "local packages", "http.tgz"), "");
  packages = {
    "@typespec/compiler": {
      name: "@typespec/compiler",
      path: join(dir, "local packages", "compiler"),
    },
    "@typespec/http": {
      name: "@typespec/http",
      path: join(dir, "local packages", "http.tgz"),
    },
  };
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("npm", () => {
  it("preserves file references and the referenced-package override guard", async () => {
    const original = JSON.stringify({
      dependencies: { "@typespec/compiler": "next", unrelated: "1.0.0" },
      overrides: { unrelated: "2.0.0" },
    });
    await writeFile(join(dir, "package.json"), original);
    await patchDependencies(dir, packages, "npm");
    const patched = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
    expect(patched.dependencies).toEqual({
      "@typespec/compiler": "file:local packages/compiler",
      unrelated: "1.0.0",
    });
    expect(patched.overrides).toEqual({
      "@typespec/compiler": "file:local packages/compiler",
      unrelated: "2.0.0",
    });
    await restoreDependencies(dir);
    expect(await readFile(join(dir, "package.json"), "utf8")).toBe(original);
  });
});

describe("pnpm", () => {
  it("patches overrides without rewriting catalogs, manifests, or unrelated settings", async () => {
    const originalManifest = '{"devDependencies":{"@typespec/compiler":"catalog:"}}';
    const originalWorkspace = `# workspace comment
packages:
  - packages/*
catalog:
  "@typespec/compiler": 1.0.0
overrides:
  "@typespec/compiler": next
  "@typespec/http@^1": next
  "consumer>@typespec/http": next
  unrelated: 2.0.0
allowBuilds:
  esbuild: true
minimumReleaseAge: 10080
`;
    await writeFile(join(dir, "package.json"), originalManifest);
    await writeFile(join(dir, "pnpm-workspace.yaml"), originalWorkspace);
    await patchDependencies(dir, packages, "pnpm");
    const text = await readFile(join(dir, "pnpm-workspace.yaml"), "utf8");
    expect(text).toContain("# workspace comment");
    expect(parse(text)).toEqual({
      ...parse(originalWorkspace),
      overrides: {
        "@typespec/compiler": `link:${packages["@typespec/compiler"].path}`,
        "@typespec/http": `file:${packages["@typespec/http"].path}`,
        "@typespec/http@^1": `file:${packages["@typespec/http"].path}`,
        "consumer>@typespec/http": `file:${packages["@typespec/http"].path}`,
        unrelated: "2.0.0",
      },
    });
    expect(await readFile(join(dir, "package.json"), "utf8")).toBe(originalManifest);
    await restoreDependencies(dir);
    expect(await readFile(join(dir, "pnpm-workspace.yaml"), "utf8")).toBe(originalWorkspace);
  });

  it("removes only a workspace file created by the patch operation", async () => {
    await writeFile(join(dir, "package.json"), "{}");
    await patchDependencies(dir, packages, "pnpm");
    expect(parse(await readFile(join(dir, "pnpm-workspace.yaml"), "utf8")).overrides).toEqual({
      "@typespec/compiler": `link:${packages["@typespec/compiler"].path}`,
      "@typespec/http": `file:${packages["@typespec/http"].path}`,
    });
    await restoreDependencies(dir);
    await expect(readFile(join(dir, "pnpm-workspace.yaml"))).rejects.toMatchObject({
      code: "ENOENT",
    });
  });

  it("preserves the original snapshot across repeated patches", async () => {
    const original = "catalog:\n  unrelated: 1.0.0\n";
    await writeFile(join(dir, "pnpm-workspace.yaml"), original);
    await patchDependencies(dir, packages, "pnpm");
    await patchDependencies(dir, packages, "pnpm");
    await restoreDependencies(dir);
    expect(await readFile(join(dir, "pnpm-workspace.yaml"), "utf8")).toBe(original);
    await restoreDependencies(dir);
    expect(await readFile(join(dir, "pnpm-workspace.yaml"), "utf8")).toBe(original);
  });

  it.each(["[invalid", "overrides: []", "- not-a-workspace-map"])(
    "reports invalid workspace configuration: %s",
    async (contents) => {
      await writeFile(join(dir, "pnpm-workspace.yaml"), contents);
      await expect(patchDependencies(dir, packages, "pnpm")).rejects.toThrow();
      expect(await readFile(join(dir, "pnpm-workspace.yaml"), "utf8")).toBe(contents);
    },
  );
});

it("install-only restoration without patch state leaves user metadata untouched", async () => {
  await writeFile(join(dir, "package.json"), '{"user":"changes"}');
  await restoreDependencies(dir);
  expect(await readFile(join(dir, "package.json"), "utf8")).toBe('{"user":"changes"}');
});

it("discards stale snapshots after checkout without restoring old contents", async () => {
  await writeFile(join(dir, "package.json"), "{}");
  await patchDependencies(dir, packages, "pnpm");
  await discardDependencyPatch(dir);
  const updated = "catalog:\n  unrelated: 2.0.0\n";
  await writeFile(join(dir, "pnpm-workspace.yaml"), updated);
  await patchDependencies(dir, packages, "pnpm");
  await restoreDependencies(dir);
  expect(await readFile(join(dir, "pnpm-workspace.yaml"), "utf8")).toBe(updated);
});
