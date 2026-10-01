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

it("preserves patches on install failure and restores them after a successful retry", async () => {
  vi.mocked(utils.execWithSpinner).mockRejectedValueOnce(new Error("install failed"));
  await expect(
    runIntegrationTestSuite(dir, "test", suite, { stages: ["patch", "install"] }),
  ).rejects.toThrow("install failed");
  expect(await readFile(join(dir, "pnpm-workspace.yaml"), "utf8")).toContain("overrides");
  await runIntegrationTestSuite(dir, "test", suite, { stages: ["install"] });
  await expect(readFile(join(dir, "pnpm-workspace.yaml"))).rejects.toMatchObject({
    code: "ENOENT",
  });
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
