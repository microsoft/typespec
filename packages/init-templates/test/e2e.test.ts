import { ok } from "assert";
import { SpawnOptions, spawn } from "child_process";
import { rm } from "fs/promises";
import { dirname } from "path";
import { resolve } from "path/posix";
import { fileURLToPath } from "url";
import { NodeHost } from "../../compiler/dist/src/index.js";
import {
  makeScaffoldingConfig,
  scaffoldNewProject,
} from "../../compiler/dist/src/init/scaffold.js";
import { builtInTemplates } from "../src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const testTempRoot = resolve(__dirname, "../temp/scaffolded-template-tests");

async function execAsync(
  command: string,
  args: string[] = [],
  options: SpawnOptions = {}
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
    options?: SpawnOptions
  ) => Promise<void>;
}

describe("Init templates e2e tests", () => {
  before(async () => {
    await rm(testTempRoot, { recursive: true, force: true });
  });

  async function scaffoldTemplate(name: string): Promise<ScaffoldedTemplateFixture> {
    const template = builtInTemplates[name];
    ok(template, `Template '${name}' not found`);
    const targetFolder = resolve(testTempRoot, name);
    await scaffoldNewProject(
      NodeHost,
      makeScaffoldingConfig(template, { name, folderName: name, directory: targetFolder })
    );

    return {
      directory: targetFolder,
      checkCommand: async (command: string, args: string[] = [], options: SpawnOptions = {}) => {
        const result = await execAsync(command, args, {
          ...options,
          cwd: resolve(testTempRoot, "emitter-ts"),
        });
        ok(
          result.exitCode === 0,
          [
            `Command '${command} ${args.join(" ")}' failed with exit code ${result.exitCode}`,
            "-".repeat(100),
            result.stdio,
            "-".repeat(100),
          ].join("\n")
        );
      },
    };
  }

  it("create emitter-ts template", async () => {
    const fixture = await scaffoldTemplate("emitter-ts");
    await fixture.checkCommand("npm", ["install"]);
    await fixture.checkCommand("npm", ["run", "build"]);
    await fixture.checkCommand("npm", ["run", "test"]);
    await fixture.checkCommand("npm", ["run", "lint"]);
    await fixture.checkCommand("npm", ["run", "format"]);
  });
});
