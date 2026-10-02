import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "pathe";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectPackageManager, getCompileCommand, getInstallCommand } from "./package-manager.js";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "tsp-integration-manager-"));
  await writeFile(join(dir, "package.json"), "{}");
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("detectPackageManager", () => {
  it.each(["npm@10.0.0", "pnpm@11.8.0", "pnpm@11.8.0+sha512.abc"])(
    "honors %s",
    async (packageManager) => {
      await writeFile(join(dir, "package.json"), JSON.stringify({ packageManager }));
      expect(await detectPackageManager(dir)).toBe(packageManager.split("@")[0]);
    },
  );

  it.each(["pnpm-workspace.yaml", "pnpm-lock.yaml"])("detects %s", async (file) => {
    await writeFile(join(dir, file), "");
    expect(await detectPackageManager(dir)).toBe("pnpm");
  });

  it("prefers the declaration over pnpm files", async () => {
    await writeFile(join(dir, "package.json"), JSON.stringify({ packageManager: "npm@10.0.0" }));
    await writeFile(join(dir, "pnpm-workspace.yaml"), "");
    expect(await detectPackageManager(dir)).toBe("npm");
  });

  it("defaults to npm without inspecting parent directories", async () => {
    const child = join(dir, "target");
    await mkdir(child);
    await writeFile(join(dir, "pnpm-workspace.yaml"), "");
    await writeFile(join(child, "package.json"), "{}");
    expect(await detectPackageManager(child)).toBe("npm");
  });

  it.each(["yarn@4.0.0", "bun@1.0.0"])("rejects unsupported %s", async (packageManager) => {
    await writeFile(join(dir, "package.json"), JSON.stringify({ packageManager }));
    await expect(detectPackageManager(dir)).rejects.toThrow("Unsupported package manager");
  });

  it.each(["pnpm", "", 42, null])("rejects malformed declaration %s", async (packageManager) => {
    await writeFile(join(dir, "package.json"), JSON.stringify({ packageManager }));
    await expect(detectPackageManager(dir)).rejects.toThrow("Invalid packageManager");
  });

  it("reports malformed JSON", async () => {
    await writeFile(join(dir, "package.json"), "{");
    await expect(detectPackageManager(dir)).rejects.toThrow();
  });
});

describe("commands", () => {
  it("keeps npm install and non-downloading exec arguments", () => {
    expect(getInstallCommand("npm")).toEqual({
      command: "npm",
      args: ["install", "--no-package-lock"],
    });
    expect(getCompileCommand("npm", "/repo with spaces/main.tsp", ["--no-emit"])).toEqual({
      command: "npm",
      args: [
        "exec",
        "--no",
        "--",
        "tsp",
        "compile",
        "/repo with spaces/main.tsp",
        "--warn-as-error",
        "--no-emit",
      ],
    });
  });

  it("uses pnpm commands without npm exec flags or lockfile writes", () => {
    expect(getInstallCommand("pnpm")).toEqual({
      command: "pnpm",
      args: ["install", "--no-lockfile", "--no-frozen-lockfile"],
    });
    expect(getCompileCommand("pnpm", "/repo/main.tsp", ["--no-emit"])).toEqual({
      command: "pnpm",
      args: [
        "--config.verify-deps-before-run=false",
        "exec",
        "tsp",
        "compile",
        "/repo/main.tsp",
        "--warn-as-error",
        "--no-emit",
      ],
    });
  });
});
