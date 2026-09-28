import { execa } from "execa";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, relative } from "pathe";
import * as tar from "tar";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Packages } from "./find-packages.js";
import { validateGitClean } from "./git.js";
import { getInstallCommand, type PackageManager } from "./package-manager.js";
import { patchDependencies, restoreDependencies } from "./patch-dependencies.js";
import { TaskRunner } from "./runner.js";
import { ValidationFailedError } from "./utils.js";
import { TspRunner, validateSpecs } from "./validate.js";

let root: string;
let target: string;

beforeEach(async () => {
  root = await realpath(await mkdtemp(join(tmpdir(), "tsp-integration-install-")));
  target = join(root, "target");
  await mkdir(target);
  await execa("git", ["init", "--quiet", target]);
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(root, { recursive: true, force: true });
});

async function createPackage(
  name: string,
  manifest: Record<string, unknown> = {},
  files: Record<string, string> = {},
): Promise<string> {
  const dir = join(root, "sources", name);
  await mkdir(dir, { recursive: true });
  await writeFile(
    join(dir, "package.json"),
    JSON.stringify({ name, version: "1.0.0", main: "index.js", ...manifest }),
  );
  for (const [file, contents] of Object.entries(files)) {
    await writeFile(join(dir, file), contents, { mode: 0o755 });
  }
  return dir;
}

async function pack(dir: string): Promise<string> {
  const destination = `${dir}.tgz`;
  await tar.c({ cwd: dir, file: destination, gzip: true, prefix: "package/" }, [
    "package.json",
    "index.js",
  ]);
  return destination;
}

async function commitTarget() {
  await writeFile(join(target, ".gitignore"), "node_modules/\n");
  await execa("git", ["add", "."], { cwd: target });
  await execa(
    "git",
    [
      "-c",
      "user.name=Integration Test",
      "-c",
      "user.email=test@example.invalid",
      "commit",
      "--no-gpg-sign",
      "--quiet",
      "-m",
      "fixture",
    ],
    { cwd: target },
  );
}

async function install(manager: PackageManager) {
  const { command, args } = getInstallCommand(manager);
  await execa(
    command,
    [
      ...args,
      ...(manager === "pnpm" ? ["--offline"] : ["--ignore-scripts", "--no-audit", "--no-fund"]),
    ],
    {
      cwd: target,
      env: { CI: "true" },
    },
  );
}

it.each(["npm", "pnpm"] as const)(
  "%s installs local tarball overrides for direct and transitive dependencies without metadata changes",
  async (manager) => {
    const candidate = await pack(
      await createPackage(
        "integration-candidate",
        {},
        { "index.js": 'module.exports = "local candidate";' },
      ),
    );
    const consumer = await pack(
      await createPackage(
        "integration-consumer",
        { dependencies: { "integration-candidate": "99.0.0" } },
        { "index.js": 'module.exports = require("integration-candidate");' },
      ),
    );
    const originalManifest = JSON.stringify({
      private: true,
      dependencies: {
        "integration-candidate": manager === "pnpm" ? "catalog:" : "99.0.0",
        "integration-consumer": `file:${relative(target, consumer)}`,
      },
    });
    await writeFile(join(target, "package.json"), originalManifest);
    const originalWorkspace = `packages:\n  - members/*\ncatalog:\n  integration-candidate: 99.0.0\noverrides:\n  integration-candidate: next\n`;
    if (manager === "pnpm") {
      await writeFile(join(target, "pnpm-workspace.yaml"), originalWorkspace);
      await mkdir(join(target, "members", "example"), { recursive: true });
      await writeFile(
        join(target, "members", "example", "package.json"),
        JSON.stringify({
          name: "integration-member",
          dependencies: {
            "integration-consumer": `file:${relative(join(target, "members", "example"), consumer)}`,
          },
        }),
      );
      await writeFile(
        join(target, "pnpm-lock.yaml"),
        "# Existing lockfile must not be read or changed\n",
      );
    } else {
      await writeFile(join(target, "package-lock.json"), "{}\n");
    }
    await commitTarget();
    await patchDependencies(
      target,
      { "integration-candidate": { name: "integration-candidate", path: candidate } },
      manager,
    );
    await install(manager);
    for (const cwd of [
      target,
      ...(manager === "pnpm" ? [join(target, "members", "example")] : []),
    ]) {
      const { stdout } = await execa(process.execPath, ["-p", 'require("integration-consumer")'], {
        cwd,
      });
      expect(stdout).toBe("local candidate");
    }
    const { stdout } = await execa(process.execPath, ["-p", 'require("integration-candidate")'], {
      cwd: target,
    });
    expect(stdout).toBe("local candidate");
    await restoreDependencies(target);
    expect(await readFile(join(target, "package.json"), "utf8")).toBe(originalManifest);
    if (manager === "pnpm") {
      expect(await readFile(join(target, "pnpm-workspace.yaml"), "utf8")).toBe(originalWorkspace);
    }
    await validateGitClean(target);
  },
  60_000,
);

it("pnpm replaces a dependency referenced only through a workspace member", async () => {
  const candidate = await createPackage(
    "integration-candidate",
    {},
    { "index.js": 'module.exports = "local peer";' },
  );
  const consumer = await pack(
    await createPackage(
      "integration-consumer",
      { dependencies: { "integration-candidate": "99.0.0" } },
      { "index.js": 'module.exports = require("integration-candidate");' },
    ),
  );
  const member = join(target, "members", "example");
  await mkdir(member, { recursive: true });
  await writeFile(join(target, "package.json"), '{"private":true}');
  await writeFile(join(target, "pnpm-workspace.yaml"), "packages:\n  - members/*\n");
  await writeFile(
    join(member, "package.json"),
    JSON.stringify({
      name: "integration-member",
      dependencies: { "integration-consumer": `file:${relative(member, consumer)}` },
    }),
  );
  await commitTarget();
  await patchDependencies(
    target,
    { "integration-candidate": { name: "integration-candidate", path: candidate } },
    "pnpm",
  );
  await install("pnpm");
  const { stdout } = await execa(process.execPath, ["-p", 'require("integration-consumer")'], {
    cwd: member,
  });
  expect(stdout).toBe("local peer");
  await restoreDependencies(target);
  await validateGitClean(target);
}, 60_000);

it("pnpm links source packages without resolving their workspace dependencies and executes entrypoints and reruns", async () => {
  const source = await createPackage(
    "integration-compiler",
    {
      bin: { tsp: "cli.js" },
      dependencies: { "source-workspace-only": "workspace:^", "source-catalog-only": "catalog:" },
    },
    {
      "index.js": 'module.exports = "original";',
      "cli.js": `#!/usr/bin/env node
const fs = require("node:fs");
console.log(JSON.stringify({ cwd: process.cwd(), args: process.argv.slice(2) }));
if (fs.readFileSync(process.argv[3], "utf8") === "fail") process.exitCode = 1;
`,
    },
  );
  const consumer = await pack(
    await createPackage(
      "integration-consumer",
      { peerDependencies: { "integration-compiler": "99.0.0" } },
      { "index.js": 'module.exports = require("integration-compiler");' },
    ),
  );
  await writeFile(
    join(target, "package.json"),
    JSON.stringify({
      private: true,
      dependencies: {
        "integration-compiler": "99.0.0",
        "integration-consumer": `file:${relative(target, consumer)}`,
      },
    }),
  );
  const member = join(target, "members", "example");
  await mkdir(member, { recursive: true });
  await writeFile(
    join(member, "package.json"),
    JSON.stringify({
      name: "integration-member",
      dependencies: { "integration-consumer": `file:${relative(member, consumer)}` },
    }),
  );
  await writeFile(
    join(target, "pnpm-workspace.yaml"),
    "packages:\n  - members/*\nverifyDepsBeforeRun: install\n",
  );
  await writeFile(join(target, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  await commitTarget();
  const packages: Packages = {
    "integration-compiler": { name: "integration-compiler", path: source },
  };
  await patchDependencies(target, packages, "pnpm");
  await install("pnpm");
  expect(await realpath(join(target, "node_modules", "integration-compiler"))).toBe(
    await realpath(source),
  );
  await writeFile(join(source, "index.js"), 'module.exports = "updated";');
  const { stdout } = await execa(process.execPath, ["-p", 'require("integration-compiler")'], {
    cwd: target,
  });
  expect(stdout).toBe("updated");
  for (const cwd of [target, member]) {
    const { stdout } = await execa(process.execPath, ["-p", 'require("integration-consumer")'], {
      cwd,
    });
    expect(stdout).toBe("updated");
  }
  await restoreDependencies(target);
  await validateGitClean(target);

  const project = join(target, "specification", "example");
  await mkdir(project, { recursive: true });
  await writeFile(join(project, "tspconfig.yaml"), "");
  await writeFile(join(project, "main.tsp"), "");
  await writeFile(join(project, "client.tsp"), "");
  const suite = {
    repo: "unused",
    branch: "unused",
    pattern: "specification/**/tspconfig.yaml",
    entrypoints: [{ name: "main.tsp" }, { name: "client.tsp", options: ["--no-emit"] }],
  };
  const reports: string[] = [];
  const runner = new TaskRunner();
  runner.reportTaskWithDetails = (_status, _name, details) => {
    reports.push(details);
  };
  await validateSpecs(runner, target, suite);
  const expectedCwd = await realpath(target);
  expect(reports[0]).toContain(
    JSON.stringify({
      cwd: expectedCwd,
      args: ["compile", join(project, "main.tsp"), "--warn-as-error"],
    }),
  );
  expect(reports[0]).toContain(
    JSON.stringify({
      cwd: expectedCwd,
      args: ["compile", join(project, "client.tsp"), "--warn-as-error", "--no-emit"],
    }),
  );

  const tspRunner = new TspRunner(runner, target, suite, [project]);
  await tspRunner.run();
  await writeFile(join(project, "main.tsp"), "fail");
  await expect(tspRunner.run()).rejects.toBeInstanceOf(ValidationFailedError);
  await writeFile(join(project, "main.tsp"), "");
  vi.spyOn(process.stdin, "write").mockReturnValue(true);
  await tspRunner.rerunFailed();
  expect(reports.at(-1)).toContain("compiled successfully");
  expect(await readFile(join(target, "pnpm-lock.yaml"), "utf8")).toBe("lockfileVersion: '9.0'\n");
}, 60_000);
