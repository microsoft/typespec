import { ChildProcess, SpawnOptions, spawn } from "child_process";
import { access, readFile, rm } from "fs/promises";
import { beforeEach, describe, expect, it } from "vitest";
import { resolvePath } from "../../../src/index.js";
import { findTestPackageRoot } from "../../../src/testing/test-utils.js";

const pkgRoot = await findTestPackageRoot(import.meta.url);
const scenarioRoot = resolvePath(pkgRoot, "test/e2e/cli/scenarios");

function getScenarioDir(name: string) {
  return resolvePath(scenarioRoot, name);
}
interface ExecCliOptions {
  cwd?: string;
}

async function execCli(args: string[], { cwd }: ExecCliOptions) {
  const node = process.platform === "win32" ? "node.exe" : "node";
  return execAsync(node, [resolvePath(pkgRoot, "entrypoints/cli.js"), ...args], { cwd });
}
async function execCliSuccess(args: string[], { cwd }: ExecCliOptions) {
  const result = await execCli(args, { cwd });
  if (result.exitCode !== 0) {
    throw new Error(`Failed to execute cli: ${result.stdio}`);
  }

  return result;
}
async function execCliFail(args: string[], { cwd }: ExecCliOptions) {
  const result = await execCli(args, { cwd });
  if (result.exitCode === 0) {
    throw new Error(`Cli succeeded but expected failure: ${result.stdio}`);
  }
  return result;
}

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  stdio: string;
  proc: ChildProcess;
}
export async function execAsync(
  command: string,
  args: string[],
  options: SpawnOptions,
): Promise<ExecResult> {
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
        stdout: Buffer.concat(stdout).toString(),
        stderr: Buffer.concat(stderr).toString(),
        stdio: Buffer.concat(stdio).toString(),
        proc: child,
      });
    });
  });
}

async function cleanOutputDir(scenarioName: string) {
  const dir = resolvePath(getScenarioDir(scenarioName), "tsp-output");
  await rm(dir, { recursive: true, force: true });
}
describe("cli", () => {
  it("shows help", async () => {
    const { stdout } = await execCliSuccess(["--help"], {
      cwd: getScenarioDir("simple"),
    });
    expect(stdout).toContain("tsp <command>");
    expect(stdout).toContain("tsp compile <path>       Compile TypeSpec source.");
    expect(stdout).toContain("tsp format <include...>  Format given list of TypeSpec files.");
  });

  describe("compiling spec with warning", () => {
    it("logs warning and succeed", async () => {
      const { stdout } = await execCliSuccess(["compile", ".", "--pretty", "false"], {
        cwd: getScenarioDir("warn"),
      });

      // eslint-disable-next-line no-console
      console.log("Stdout", stdout);
      expect(stdout).toContain("main.tsp:5:8 - warning deprecated: Deprecated: Deprecated");
      expect(stdout).toContain("Found 1 warning.");
    });

    it("logs warning as error(and fail) when using --warn-as-error", async () => {
      const { stdout } = await execCliFail(
        ["compile", ".", "--warn-as-error", "--pretty", "false"],
        {
          cwd: getScenarioDir("warn"),
        },
      );
      // eslint-disable-next-line no-console
      console.log("Stdout", stdout);
      expect(stdout).toContain("main.tsp:5:8 - error deprecated: Deprecated: Deprecated");
      expect(stdout).toContain("Found 1 error.");
    });
  });

  describe("compiling with an emitter", () => {
    beforeEach(async () => {
      await cleanOutputDir("with-emitter");
    });

    it("emits output", async () => {
      const { stdout } = await execCliSuccess(["compile", ".", "--emit", "./emitter.js"], {
        cwd: getScenarioDir("with-emitter"),
      });
      expect(stdout).toContain("Compilation completed successfully.");
      const file = await readFile(
        resolvePath(getScenarioDir("with-emitter"), "tsp-output/out.txt"),
      );
      expect(file.toString()).toEqual("Hello, world!");
    });

    it("doesn't emit output when --noEmit is set", async () => {
      const { stdout } = await execCliSuccess(
        ["compile", ".", "--emit", "./emitter.js", "--no-emit"],
        {
          cwd: getScenarioDir("with-emitter"),
        },
      );
      expect(stdout).toContain("Compilation completed successfully.");
      await expect(() =>
        access(resolvePath(getScenarioDir("with-emitter"), "tsp-output/out.txt")),
      ).rejects.toEqual(expect.any(Error));
    });
  });

  describe("compiling with no emitter", () => {
    it("logs warnings", async () => {
      const { stdout } = await execCliSuccess(["compile", "."], {
        cwd: getScenarioDir("simple"),
      });
      expect(stdout).toContain(
        "No emitter was configured, no output was generated. Use `--emit <emitterName>` to pick emitter or specify it in the TypeSpec config.",
      );
    });

    it("doesn't log warning when --noEmit is set", async () => {
      const { stdout } = await execCliSuccess(["compile", ".", "--no-emit"], {
        cwd: getScenarioDir("simple"),
      });
      expect(stdout).not.toContain(
        "No emitter was configured, no output was generated. Use `--emit <emitterName>` to pick emitter or specify it in the TypeSpec config.",
      );
    });
  });

  it("can provide emitter options", async () => {
    const { stdout } = await execCliSuccess(
      ["compile", ".", "--emit", "./emitter.js", "--option", "test-emitter.text=foo"],
      {
        cwd: getScenarioDir("with-emitter"),
      },
    );
    expect(stdout).toContain("Compilation completed successfully.");
    const file = await readFile(resolvePath(getScenarioDir("with-emitter"), "tsp-output/out.txt"));
    expect(file.toString()).toEqual("foo");
  });

  it("set config parameter with --arg", async () => {
    await cleanOutputDir("with-config");

    const { stdout } = await execCliSuccess(
      ["compile", ".", "--emit", "./emitter.js", "--arg", "custom-dir=custom-dir-name"],
      {
        cwd: getScenarioDir("with-config"),
      },
    );
    expect(stdout).toContain("Compilation completed successfully.");
    await access(resolvePath(getScenarioDir("with-config"), "tsp-output/custom-dir-name/out.txt"));
  });
});
