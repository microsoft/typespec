import { execa } from "execa";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "pathe";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import * as findPackages from "./find-packages.js";
import * as git from "./git.js";
import { runIntegrationTestSuite } from "./run.js";
import * as utils from "./utils.js";
import * as validation from "./validate.js";

let dir: string;
const suite = { repo: "unused", branch: "unused" };
const original = '{"packageManager":"pnpm@11.8.0"}';

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "tsp-integration-run-"));
  await execa("git", ["init", "--quiet", dir]);
  await writeFile(join(dir, "package.json"), original);
  vi.spyOn(findPackages, "findPackages").mockResolvedValue({});
  vi.spyOn(utils, "execWithSpinner").mockResolvedValue();
  vi.spyOn(validation, "validateSpecs").mockResolvedValue();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(dir, { recursive: true, force: true });
});

it("installs and restores metadata across separate patch/install stage invocations", async () => {
  await runIntegrationTestSuite(dir, "test", suite, { stages: ["patch"] });
  expect(await readFile(join(dir, "pnpm-workspace.yaml"), "utf8")).toContain("overrides");

  await runIntegrationTestSuite(dir, "test", suite, { stages: ["install"] });
  expect(utils.execWithSpinner).toHaveBeenCalledExactlyOnceWith(
    expect.anything(),
    "pnpm",
    ["install", "--no-lockfile", "--no-frozen-lockfile"],
    { cwd: dir },
  );
  await expect(readFile(join(dir, "pnpm-workspace.yaml"))).rejects.toMatchObject({
    code: "ENOENT",
  });
  expect(await readFile(join(dir, "package.json"), "utf8")).toBe(original);
});

it.each([
  { lockfile: undefined, fail: false },
  { lockfile: undefined, fail: true },
  { lockfile: "# original lockfile\n", fail: false },
  { lockfile: "# original lockfile\n", fail: true },
])("restores pnpm metadata after installation: %j", async ({ lockfile, fail }) => {
  const lockfilePath = join(dir, "pnpm-lock.yaml");
  const workspacePath = join(dir, "pnpm-workspace.yaml");
  const workspace = "# original workspace\nallowBuilds:\n  autorest: true\n";
  await writeFile(workspacePath, workspace);
  if (lockfile !== undefined) await writeFile(lockfilePath, lockfile);
  const error = new Error("ERR_PNPM_IGNORED_BUILDS");
  vi.mocked(utils.execWithSpinner).mockImplementationOnce(async () => {
    await writeFile(lockfilePath, "# package-manager metadata written by pnpm\n");
    await writeFile(workspacePath, "allowBuilds:\n  unreviewed: set this to true or false\n");
    if (fail) throw error;
  });

  await runIntegrationTestSuite(dir, "test", suite, { stages: ["patch"] });
  const install = runIntegrationTestSuite(dir, "test", suite, { stages: ["install", "validate"] });
  if (fail) {
    await expect(install).rejects.toBe(error);
    expect(validation.validateSpecs).not.toHaveBeenCalled();
  } else {
    await install;
  }
  expect(await utils.readOptionalFile(lockfilePath)).toBe(lockfile);
  expect(await readFile(workspacePath, "utf8")).toBe(workspace);
  expect(await readFile(join(dir, "package.json"), "utf8")).toBe(original);

  await runIntegrationTestSuite(dir, "test", suite, { stages: ["patch", "install"] });
  expect(await readFile(workspacePath, "utf8")).toBe(workspace);
  expect(await utils.readOptionalFile(lockfilePath)).toBe(lockfile);
});

it("restores npm metadata after an installation failure", async () => {
  const manifest = '{"dependencies":{"@typespec/compiler":"next"}}';
  await writeFile(join(dir, "package.json"), manifest);
  vi.mocked(utils.execWithSpinner).mockRejectedValueOnce(new Error("install failed"));
  await expect(
    runIntegrationTestSuite(dir, "test", suite, { stages: ["patch", "install"] }),
  ).rejects.toThrow("install failed");
  expect(await readFile(join(dir, "package.json"), "utf8")).toBe(manifest);
});

it("preserves an existing pnpm lockfile during an install-only invocation", async () => {
  const path = join(dir, "pnpm-lock.yaml");
  await writeFile(path, "# user changes\n");
  vi.mocked(utils.execWithSpinner).mockImplementationOnce(async () => {
    await writeFile(path, "# pnpm changes\n");
  });
  await runIntegrationTestSuite(dir, "test", suite, { stages: ["install"] });
  expect(await readFile(path, "utf8")).toBe("# user changes\n");
});

it("keeps npm install arguments and leaves unpatched user metadata alone", async () => {
  await writeFile(join(dir, "package.json"), "{}");
  await runIntegrationTestSuite(dir, "test", suite, { stages: ["install"] });
  expect(utils.execWithSpinner).toHaveBeenCalledExactlyOnceWith(
    expect.anything(),
    "npm",
    ["install", "--no-package-lock"],
    { cwd: dir },
  );
  expect(await readFile(join(dir, "package.json"), "utf8")).toBe("{}");
});

it("runs validation on its own without installing dependencies", async () => {
  await runIntegrationTestSuite(dir, "test", suite, {
    stages: ["validate"],
    interactive: true,
  });
  expect(utils.execWithSpinner).not.toHaveBeenCalled();
  expect(validation.validateSpecs).toHaveBeenCalledWith(expect.anything(), dir, suite, {
    interactive: true,
  });
});

it("does not detect a package manager for checkout-only or cleanliness-only runs", async () => {
  await rm(join(dir, "package.json"));
  vi.spyOn(git, "ensureRepoState").mockResolvedValue();
  vi.spyOn(git, "validateGitClean").mockResolvedValue();
  await runIntegrationTestSuite(dir, "test", suite, { stages: ["checkout", "validate:clean"] });
  expect(git.ensureRepoState).toHaveBeenCalled();
  expect(git.validateGitClean).toHaveBeenCalled();
  expect(utils.execWithSpinner).not.toHaveBeenCalled();
});
