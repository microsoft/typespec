import { execa } from "execa";
import { rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "pathe";
import { isMap, parseDocument } from "yaml";
import type { Packages } from "./find-packages.js";
import type { PackageManager } from "./package-manager.js";
import { patchPackageJson } from "./patch-package-json.js";
import { log, readOptionalFile } from "./utils.js";

const patchFiles = ["package.json", "pnpm-workspace.yaml"] as const;
type PatchFile = (typeof patchFiles)[number];
type PatchState = Partial<Record<PatchFile, string | null>>;

export async function patchDependencies(dir: string, packages: Packages, manager: PackageManager) {
  if (manager === "npm") {
    await saveOriginalFile(dir, "package.json");
    await patchPackageJson(dir, packages);
  } else {
    await patchPnpmWorkspace(dir, packages);
  }
}

async function patchPnpmWorkspace(dir: string, packages: Packages) {
  const path = join(dir, "pnpm-workspace.yaml");
  const contents = await readOptionalFile(path);
  const document = parseDocument(contents ?? "");
  if (document.errors.length > 0) {
    throw new Error(`Invalid ${path}: ${document.errors.map((error) => error.message).join("\n")}`);
  }
  if (document.contents !== null && !isMap(document.contents)) {
    throw new Error(`Invalid ${path}: expected a workspace mapping.`);
  }
  const overrides = document.get("overrides", true);
  if (overrides !== undefined && !isMap(overrides)) {
    throw new Error(`Invalid ${path}: overrides must be a mapping.`);
  }

  if (overrides === undefined) document.set("overrides", document.createNode({}));
  for (const pkg of Object.values(packages)) {
    const protocol = (await stat(pkg.path)).isDirectory() ? "link:" : "file:";
    // pnpm can resolve overridden peer paths relative to a workspace member instead of the root.
    const reference = `${protocol}${resolve(pkg.path)}`;
    if (isMap(overrides)) {
      for (const { key } of overrides.items) {
        const selector = String(key);
        const dependency = selector.slice(selector.lastIndexOf(">") + 1);
        if (dependency === pkg.name || dependency.startsWith(`${pkg.name}@`)) {
          document.setIn(["overrides", selector], reference);
        }
      }
    }
    document.setIn(["overrides", pkg.name], reference);
    log(`Updated pnpm override: ${pkg.name} -> ${reference}`);
  }

  await saveOriginalFile(dir, "pnpm-workspace.yaml");
  await writeFile(path, document.toString());
}

async function getPatchStatePath(dir: string): Promise<string> {
  const { stdout } = await execa(
    "git",
    ["rev-parse", "--path-format=absolute", "--git-path", "tsp-integration-patch.json"],
    { cwd: dir },
  );
  return stdout;
}

async function readPatchState(path: string): Promise<PatchState> {
  const contents = await readOptionalFile(path);
  if (contents === undefined) return {};
  const state: unknown = JSON.parse(contents);
  if (typeof state !== "object" || state === null || Array.isArray(state)) {
    throw new Error(`Invalid integration patch state: ${path}`);
  }
  const result: PatchState = {};
  for (const [file, contents] of Object.entries(state)) {
    if (
      (file !== "package.json" && file !== "pnpm-workspace.yaml") ||
      (contents !== null && typeof contents !== "string")
    ) {
      throw new Error(`Invalid integration patch state: ${path}`);
    }
    result[file] = contents;
  }
  return result;
}

async function saveOriginalFile(dir: string, file: PatchFile) {
  const statePath = await getPatchStatePath(dir);
  const state = await readPatchState(statePath);
  if (!(file in state)) {
    state[file] = (await readOptionalFile(join(dir, file))) ?? null;
    await writeFile(statePath, JSON.stringify(state));
  }
}

export async function restoreDependencies(dir: string) {
  const statePath = await getPatchStatePath(dir);
  const state = await readPatchState(statePath);
  for (const file of patchFiles) {
    const contents = state[file];
    if (contents === null) {
      await rm(join(dir, file), { force: true });
    } else if (contents !== undefined) {
      await writeFile(join(dir, file), contents);
    }
  }
  await rm(statePath, { force: true });
}

export async function discardDependencyPatch(dir: string) {
  await rm(await getPatchStatePath(dir), { force: true });
}
