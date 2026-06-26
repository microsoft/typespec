import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { pathToFileURL } from "url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { compile as Compile } from "../../../src/core/program.js";
import type { CompilerHost } from "../../../src/core/types.js";

// The sandbox forks children that must run compiled JS, so this e2e runs against
// the built `dist` and is skipped when the package has not been built.
const distProgram = resolve("dist/src/core/program.js");
const isBuilt = existsSync(distProgram);

describe.skipIf(!isBuilt)("sandboxed emitter execution (e2e)", () => {
  let compile: typeof Compile;
  let NodeHost: CompilerHost;
  let workDir: string;
  let mainFile: string;

  beforeAll(async () => {
    compile = (await import(pathToFileURL(distProgram).href)).compile;
    NodeHost = (await import(pathToFileURL(resolve("dist/src/core/node-host.js")).href)).NodeHost;

    workDir = mkdtempSync(join(tmpdir(), "tsp-emit-sandbox-"));
    mainFile = join(workDir, "main.tsp");
    writeFileSync(mainFile, `op ping(): void;\n`);

    // A plain emitter (no declared permissions) that writes one output file.
    writeEmitter("plain-emitter", { name: "plain-emitter" });
    // An emitter that *requests* network access in its manifest.
    writeEmitter("net-emitter", {
      name: "net-emitter",
      permissions: [
        { permission: { kind: "network", hosts: ["example.com"] }, reason: "calls home" },
      ],
    });
  });

  afterAll(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  function writeEmitter(name: string, lib: object): string {
    const dir = join(workDir, name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name, version: "0.0.0", main: "index.js", type: "module" }),
    );
    writeFileSync(
      join(dir, "index.js"),
      `export const $lib = ${JSON.stringify(lib)};
       export async function $onEmit(context) {
         const dir = context.emitterOutputDir;
         await context.program.host.mkdirp(dir);
         await context.program.host.writeFile(dir + "/out.txt", "emitted-by-sandbox");
       }
      `,
    );
    return dir;
  }

  function writeEmitterWithBody(name: string, body: string): string {
    const dir = join(workDir, name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name, version: "0.0.0", main: "index.js", type: "module" }),
    );
    writeFileSync(
      join(dir, "index.js"),
      `export const $lib = { name: ${JSON.stringify(name)} };
       export async function $onEmit(context) {
         ${body}
       }
      `,
    );
    return dir;
  }

  function configFile(permissions?: Record<string, unknown>) {
    return { projectRoot: workDir, permissions, file: undefined } as any;
  }

  it("runs an emitter with no declared permissions and writes its output", async () => {
    const outputDir = join(workDir, "out-plain");
    const program = await compile(NodeHost, mainFile, {
      sandbox: true,
      emit: [join(workDir, "plain-emitter")],
      outputDir,
      options: { "plain-emitter": { "emitter-output-dir": outputDir } },
      configFile: configFile(),
    });

    expect(program.diagnostics).toEqual([]);
    expect(readFileSync(join(outputDir, "out.txt"), "utf8")).toBe("emitted-by-sandbox");
  });

  it("blocks an emitter whose requested permissions were not granted", async () => {
    const outputDir = join(workDir, "out-denied");
    const program = await compile(NodeHost, mainFile, {
      sandbox: true,
      emit: [join(workDir, "net-emitter")],
      outputDir,
      options: { "net-emitter": { "emitter-output-dir": outputDir } },
      configFile: configFile(),
    });

    const denied = program.diagnostics.find((d) => d.code === "permission-not-granted");
    expect(denied).toBeDefined();
    expect(denied!.message).toContain("net-emitter");
    expect(denied!.message).toContain("network");
    // The emitter was skipped, so nothing was written.
    expect(existsSync(join(outputDir, "out.txt"))).toBe(false);
  });

  it("runs an emitter once its requested permissions are granted in config", async () => {
    const outputDir = join(workDir, "out-granted");
    const program = await compile(NodeHost, mainFile, {
      sandbox: true,
      emit: [join(workDir, "net-emitter")],
      outputDir,
      options: { "net-emitter": { "emitter-output-dir": outputDir } },
      configFile: configFile({ "net-emitter": { network: ["example.com"] } }),
    });

    expect(program.diagnostics.find((d) => d.code === "permission-not-granted")).toBeUndefined();
    expect(readFileSync(join(outputDir, "out.txt"), "utf8")).toBe("emitted-by-sandbox");
  });

  it("lets an emitter read its own package directory through the host", async () => {
    const dir = writeEmitterWithBody(
      "self-read-emitter",
      `const { fileURLToPath } = await import("url");
       const pkgPath = fileURLToPath(new URL("./package.json", import.meta.url));
       const pkg = await context.program.host.readFile(pkgPath);
       const out = context.emitterOutputDir;
       await context.program.host.mkdirp(out);
       await context.program.host.writeFile(out + "/pkg-name.txt", JSON.parse(pkg.text).name);`,
    );
    const outputDir = join(workDir, "out-self-read");
    const program = await compile(NodeHost, mainFile, {
      sandbox: true,
      emit: [dir],
      outputDir,
      options: { "self-read-emitter": { "emitter-output-dir": outputDir } },
      configFile: configFile(),
    });

    expect(program.diagnostics).toEqual([]);
    expect(readFileSync(join(outputDir, "pkg-name.txt"), "utf8")).toBe("self-read-emitter");
  });

  it("blocks an emitter from reading outside its grant through the host", async () => {
    const dir = writeEmitterWithBody(
      "escape-emitter",
      `await context.program.host.readFile(${JSON.stringify(mainFile)});`,
    );
    const outputDir = join(workDir, "out-escape");

    // Reading the spec (outside the emitter's grant) makes $onEmit throw, which
    // the compiler surfaces as an emitter crash rather than a silent success.
    await expect(
      compile(NodeHost, mainFile, {
        sandbox: true,
        emit: [dir],
        outputDir,
        options: { "escape-emitter": { "emitter-output-dir": outputDir } },
        configFile: configFile(),
      }),
    ).rejects.toThrow(/ERR_ACCESS_DENIED|Permission denied|escape-emitter/);
  });
});
