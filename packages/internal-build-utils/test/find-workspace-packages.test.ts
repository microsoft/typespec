import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { findWorkspacePackages } from "../src/find-workspace-packages.js";

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "find-ws-packages-"));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function writePackage(dir: string, manifest: Record<string, unknown>) {
  const full = join(root, dir);
  await mkdir(full, { recursive: true });
  await writeFile(join(full, "package.json"), JSON.stringify(manifest, null, 2));
}

async function writeWorkspace(patterns: string[]) {
  await writeFile(
    join(root, "pnpm-workspace.yaml"),
    `packages:\n${patterns.map((p) => `  - "${p}"`).join("\n")}\n`,
  );
}

describe("findWorkspacePackages", () => {
  it("discovers packages matching positive globs", async () => {
    await writeWorkspace(["packages/*"]);
    await writePackage("packages/alpha", { name: "alpha", version: "1.0.0" });
    await writePackage("packages/beta", { name: "beta", version: "2.0.0" });

    const packages = await findWorkspacePackages(root);
    const names = packages.map((p) => p.manifest.name).sort();
    expect(names).toEqual(["alpha", "beta"]);
  });

  it("excludes packages matching negative patterns", async () => {
    await writeWorkspace(["packages/*", "!packages/excluded-*/**"]);
    await writePackage("packages/kept", { name: "kept", version: "1.0.0" });
    await writePackage("packages/excluded-one", { name: "excluded-one", version: "1.0.0" });

    const packages = await findWorkspacePackages(root);
    expect(packages.map((p) => p.manifest.name)).toEqual(["kept"]);
  });

  it("ignores directories without a package.json", async () => {
    await writeWorkspace(["packages/*"]);
    await writePackage("packages/real", { name: "real", version: "1.0.0" });
    await mkdir(join(root, "packages/empty"), { recursive: true });

    const packages = await findWorkspacePackages(root);
    expect(packages.map((p) => p.manifest.name)).toEqual(["real"]);
  });

  it("does not filter out private or unnamed packages", async () => {
    await writeWorkspace(["packages/*"]);
    await writePackage("packages/priv", { name: "priv", version: "1.0.0", private: true });
    await writePackage("packages/noname", { version: "1.0.0" });

    const packages = await findWorkspacePackages(root);
    expect(packages).toHaveLength(2);
  });

  it("returns relative rootDir and absolute rootDirRealPath", async () => {
    await writeWorkspace(["packages/*"]);
    await writePackage("packages/alpha", { name: "alpha", version: "1.0.0" });

    const [pkg] = await findWorkspacePackages(root);
    expect(pkg.rootDir).toBe(join("packages", "alpha"));
    expect(pkg.rootDirRealPath).toMatch(/alpha$/);
    expect(pkg.rootDirRealPath.startsWith(root) || pkg.rootDirRealPath.includes("alpha")).toBe(
      true,
    );
  });

  it("supports single-directory patterns", async () => {
    await writeWorkspace(["packages/*", "e2e"]);
    await writePackage("packages/alpha", { name: "alpha", version: "1.0.0" });
    await writePackage("e2e", { name: "e2e-tests", version: "1.0.0" });

    const packages = await findWorkspacePackages(root);
    expect(packages.map((p) => p.manifest.name).sort()).toEqual(["alpha", "e2e-tests"]);
  });

  it("returns an empty array when no positive patterns", async () => {
    await writeWorkspace([]);
    const packages = await findWorkspacePackages(root);
    expect(packages).toEqual([]);
  });
});
