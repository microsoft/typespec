import { execa } from "execa";
import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "path";

const projectDir = resolve(import.meta.dirname, "..");
const distDir = resolve(projectDir, "dist");
const exe = process.platform === "win32" ? "tsp.exe" : "tsp";
const exePath = resolve(distDir, exe);
await main();

async function main() {
  await commandRuns();
  if (process.argv.includes("--smoke-only")) {
    return;
  }
  await bundledInitWorks();
  await compileRequiresLocalCompiler();
  await localCompilerTakesPrecedence();
}

async function run(
  args: string[],
  options: { cwd?: string; env?: Record<string, string | undefined> } = {},
) {
  return await execa(exePath, args, {
    ...options,
    // Strip `NODE_PATH` so the executable resolves modules like a real end-user install would. The
    // harness that runs these checks (`npx tsx`) injects a `NODE_PATH` pointing at the monorepo's
    // pnpm store, where `@typespec/compiler` is resolvable. If we left it in place, the bundled
    // compiler would always "find" a local compiler via global paths and the bundled/guard code
    // paths would never be exercised.
    env: { ...options.env, NODE_PATH: undefined },
    reject: false,
  });
}

async function commandRuns() {
  const result = await run(["--help"]);
  if (result.stdout.includes("tsp <command>")) {
    console.log("✅ command working!");
  } else {
    console.error("Executable is not working");
    console.error(`exitCode: ${result.exitCode}, signal: ${result.signal ?? "none"}`);
    console.error(`message: ${result.shortMessage ?? result.message ?? "none"}`);
    console.error("Std out----------------");
    console.error(result.stdout);
    console.error("Std err----------------");
    console.error(result.stderr);
    process.exit(1);
  }
}

/**
 * Verify that the `init` templates bundled into the executable are served from memory, so `tsp init`
 * can list templates fully offline with no project-local compiler installed.
 *
 * Runs in a directory OUTSIDE the repo so that no ancestor `node_modules/@typespec/compiler` is
 * resolvable; otherwise the local compiler would take precedence and the bundled path would never be
 * exercised.
 */
async function bundledInitWorks() {
  const testDir = await mkdtemp(join(tmpdir(), "tsp-bundled-init-"));
  try {
    // `--no-prompt` without `--template` makes `init` list the bundled templates and then error,
    // which exercises reading `templates/scaffolding.json` from the embedded asset without touching
    // the network or scaffolding any files.
    const result = await run(["init", "--no-prompt"], { cwd: testDir });
    if (result.stderr.includes("emitter-ts") || result.stdout.includes("emitter-ts")) {
      console.log("✅ bundled init templates working!");
    } else {
      console.error("Bundled init templates were not served from the executable");
      console.error(result.stdout);
      console.error("Std err----------------");
      console.error(result.stderr);
      process.exit(1);
    }
  } finally {
    await rm(testDir, { recursive: true, force: true });
  }
}

/**
 * Verify that `tsp compile` with the bare executable and no project-local `@typespec/compiler` fails
 * with actionable guidance (the standalone CLI does not bundle the standard library).
 *
 * Runs in a directory OUTSIDE the repo so no ancestor `node_modules/@typespec/compiler` is
 * resolvable (which would otherwise take precedence and actually compile).
 */
async function compileRequiresLocalCompiler() {
  const testDir = await mkdtemp(join(tmpdir(), "tsp-compile-requires-local-"));
  try {
    await writeFile(resolve(testDir, "main.tsp"), "op ping(): void;\n");
    const result = await run(["compile", "main.tsp", "--no-emit"], { cwd: testDir });
    if (result.exitCode !== 0 && result.stderr.includes("tsp install")) {
      console.log("✅ compile requires a local compiler!");
    } else {
      console.error("Expected `tsp compile` to fail asking for a local compiler");
      console.error(`exit code: ${result.exitCode}`);
      console.error(result.stdout);
      console.error("Std err----------------");
      console.error(result.stderr);
      process.exit(1);
    }
  } finally {
    await rm(testDir, { recursive: true, force: true });
  }
}

/**
 * Verify that a `@typespec/compiler` installed in the current project takes precedence over the
 * compiler bundled into the executable.
 */
async function localCompilerTakesPrecedence() {
  const sentinel = "LOCAL_COMPILER_SENTINEL";
  const testDir = resolve(projectDir, "temp", "local-precedence-test");
  const compilerDir = resolve(testDir, "node_modules", "@typespec", "compiler");
  await rm(testDir, { recursive: true, force: true });
  await mkdir(resolve(compilerDir, "cmd"), { recursive: true });
  // A fake local compiler with no `exports` field so the subpath `package.json` stays resolvable.
  await writeFile(
    resolve(compilerDir, "package.json"),
    JSON.stringify({ name: "@typespec/compiler", version: "0.0.0-fake" }),
  );
  await writeFile(
    resolve(compilerDir, "cmd", "tsp.js"),
    `console.log(${JSON.stringify(sentinel)});\nprocess.exit(0);\n`,
  );

  const result = await run(["--version"], { cwd: testDir });
  if (result.stdout.includes(sentinel)) {
    console.log("✅ local compiler precedence working!");
  } else {
    console.error("Local compiler was not used; the bundled compiler ran instead");
    console.error(result.stdout);
    console.error("Std err----------------");
    console.error(result.stderr);
    process.exit(1);
  }
}
