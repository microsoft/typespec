import { ok } from "assert";
import { spawn, SpawnOptions } from "child_process";
import { readdir, readFile, rm, writeFile } from "fs/promises";
import { dirname, join, relative, resolve } from "pathe";
import { fileURLToPath } from "url";
import { afterAll, beforeAll, describe, it, vi } from "vitest";
import { NodeHost } from "../../src/index.js";
import { getTypeSpecCoreTemplates } from "../../src/init/core-templates.js";
import { makeScaffoldingConfig, scaffoldNewProject } from "../../src/init/scaffold.js";

const fetchMock = vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ name: "mock-pkg", version: "1.0.0" }),
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const testTempRoot = resolve(__dirname, "../../temp/scaffolded-template-tests");
const snapshotFolder = resolve(__dirname, "../../templates/__snapshots__");
const repoRoot = resolve(__dirname, "../../../..");
const packagesRoot = resolve(repoRoot, "packages");

/**
 * Build a mapping from @typespec/* package names to their local file paths.
 */
async function resolveLocalPackageMap(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const dirs = await readdir(packagesRoot);
  for (const dir of dirs) {
    try {
      const pkgJsonPath = join(packagesRoot, dir, "package.json");
      const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf-8"));
      if (pkgJson.name?.startsWith("@typespec/")) {
        map[pkgJson.name] = join(packagesRoot, dir);
      }
    } catch {
      // skip directories without package.json
    }
  }
  return map;
}

/**
 * Rewrite the package.json in the given directory to use local file: references
 * for @typespec/* dependencies instead of registry versions.
 */
async function useLocalDependencies(
  directory: string,
  localPackages: Record<string, string>,
): Promise<void> {
  const pkgJsonPath = join(directory, "package.json");
  const pkgJson = JSON.parse(await readFile(pkgJsonPath, "utf-8"));

  for (const field of ["dependencies", "devDependencies", "peerDependencies"] as const) {
    const deps = pkgJson[field];
    if (deps) {
      for (const [name, _version] of Object.entries(deps)) {
        if (name in localPackages) {
          deps[name] = `file:${relative(directory, localPackages[name])}`;
        }
      }
    }
  }

  await writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2));
}

async function execAsync(
  command: string,
  args: string[] = [],
  options: SpawnOptions = {},
): Promise<{ exitCode: number; stdio: string; stdout: string; stderr: string; proc: any }> {
  const child = spawn(command, args, options);

  return new Promise((resolve, reject) => {
    child.on("error", (error) => {
      reject(error);
    });
    const stdio: Buffer[] = [];
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout?.on("data", (data) => {
      stdout.push(data);
      stdio.push(data);
    });
    child.stderr?.on("data", (data) => {
      stderr.push(data);
      stdio.push(data);
    });

    child.on("exit", (exitCode) => {
      resolve({
        exitCode: exitCode ?? -1,
        stdio: Buffer.concat(stdio).toString(),
        stdout: Buffer.concat(stdout).toString(),
        stderr: Buffer.concat(stderr).toString(),
        proc: child,
      });
    });
  });
}

interface ScaffoldedTemplateFixture {
  /** Directory where the template was created. */
  readonly directory: string;
  readonly checkCommand: (
    command: string,
    args?: string[],
    options?: SpawnOptions,
  ) => Promise<void>;
}

describe("Init templates e2e tests", () => {
  beforeAll(async () => {
    await rm(testTempRoot, { recursive: true, force: true });
  });

  async function scaffoldTemplateTo(name: string, targetFolder: string) {
    const typeSpecCoreTemplates = await getTypeSpecCoreTemplates(NodeHost);
    const template = typeSpecCoreTemplates.templates[name];
    ok(template, `Template '${name}' not found`);
    await scaffoldNewProject(
      NodeHost,
      makeScaffoldingConfig(template, {
        name,
        directory: targetFolder,
        baseUri: typeSpecCoreTemplates.baseUri,
      }),
    );
  }
  async function scaffoldTemplateSnapshot(name: string): Promise<void> {
    await scaffoldTemplateTo(name, resolve(snapshotFolder, name));
  }

  async function scaffoldTemplateForTest(name: string): Promise<ScaffoldedTemplateFixture> {
    const targetFolder = resolve(testTempRoot, name);
    await scaffoldTemplateTo(name, targetFolder);

    // Replace @typespec/* dependency versions with local file: references
    // so that tests use the locally built packages instead of pulling from npm.
    const localPackages = await resolveLocalPackageMap();
    await useLocalDependencies(targetFolder, localPackages);

    return {
      directory: targetFolder,
      checkCommand: async (command: string, args: string[] = [], options: SpawnOptions = {}) => {
        const xplatCmd = process.platform === "win32" ? `${command}.cmd` : command;
        const shell = process.platform === "win32" ? true : options.shell;
        const result = await execAsync(xplatCmd, args, {
          shell,
          ...options,
          cwd: targetFolder,
        });
        ok(
          result.exitCode === 0,
          [
            `Command '${command} ${args.join(" ")}' failed with exit code ${result.exitCode}`,
            "-".repeat(100),
            result.stdio,
            "-".repeat(100),
          ].join("\n"),
        );
      },
    };
  }

  describe("create template snapshots", () => {
    beforeAll(async () => {
      vi.stubGlobal("fetch", fetchMock);
      await rm(snapshotFolder, { recursive: true, force: true });
    });

    afterAll(() => {
      vi.unstubAllGlobals();
    });

    it("rest", () => scaffoldTemplateSnapshot("rest"));
    it("emitter-ts", () => scaffoldTemplateSnapshot("emitter-ts"));
    it("library-ts", () => scaffoldTemplateSnapshot("library-ts"));
  });

  describe("validate templates", () => {
    it("validate rest template", async () => {
      const fixture = await scaffoldTemplateForTest("rest");
      await fixture.checkCommand("npm", ["install"]);
      await fixture.checkCommand("npx", ["tsp", "compile", "."]);
    });
    it("validate emitter-ts template", async () => {
      const fixture = await scaffoldTemplateForTest("emitter-ts");
      await fixture.checkCommand("npm", ["install"]);
      await fixture.checkCommand("npm", ["run", "build"]);
      await fixture.checkCommand("npm", ["run", "test"]);
      await fixture.checkCommand("npm", ["run", "lint"]);
      await fixture.checkCommand("npm", ["run", "format"]);
    });

    it("validate library-ts template", async () => {
      const fixture = await scaffoldTemplateForTest("library-ts");
      await fixture.checkCommand("npm", ["install"]);
      await fixture.checkCommand("npm", ["run", "build"]);
      await fixture.checkCommand("npm", ["run", "test"]);
      await fixture.checkCommand("npm", ["run", "lint"]);
      await fixture.checkCommand("npm", ["run", "format"]);
    });
  });
});
