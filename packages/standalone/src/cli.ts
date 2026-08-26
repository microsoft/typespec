import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { importExternal } from "./import-workaround.js";
import { serveFromMemory } from "./module-loader.js";

const COMPILER_SPECIFIER = "typespec:bundled-compiler";
const COMPILER_URL = pathToFileURL(
  join(dirname(process.execPath), "__typespec_bundled__", "compiler.mjs"),
).href;

if (process.env.TYPESPEC_CLI_PASSTHROUGH === "1") {
  // The compiler's `tsp install` command forks a package manager (npm) using this executable as
  // the Node runtime. In that case behave like plain `node <script>`.
  process.argv.shift(); // We receive ["tsp", "tsp", "entrypoint"] and we want to match ["node", "entrypoint"]
  process.execArgv = [];
  importExternal(pathToFileURL(process.argv[1]).href).catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  });
} else {
  const args = parseArgs({
    options: {
      server: { type: "string" },
    },
    strict: false,
  });

  async function main() {
    if (args.values.server) {
      await importExternal(pathToFileURL(args.values.server as string).href);
    } else if (process.env.TYPESPEC_COMPILER_PATH) {
      await importExternal(pathToFileURL(process.env.TYPESPEC_COMPILER_PATH).href);
    } else {
      const localCompiler = resolveLocalCompiler(process.cwd());
      if (localCompiler) {
        // Prefer a compiler installed in the current project over the one bundled in the CLI.
        await importExternal(pathToFileURL(localCompiler).href);
      } else {
        await runBundledCompiler();
      }
    }
  }

  main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  });

  /**
   * Resolve the `cmd/tsp.js` entry of a `@typespec/compiler` installed in the given directory, if
   * any. Returns `undefined` when no local compiler is installed.
   */
  function resolveLocalCompiler(cwd: string): string | undefined {
    try {
      const require = createRequire(join(cwd, "__tsp_resolve__.js"));
      const packageJsonPath = require.resolve("@typespec/compiler/package.json");
      const cmd = join(dirname(packageJsonPath), "cmd", "tsp.js");
      return existsSync(cmd) ? cmd : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Run the compiler that is bundled into this executable. The compiler (ESM, using top-level
   * `await`) and its `init` templates are embedded as single-executable assets and served from
   * memory; nothing is downloaded or written to disk.
   *
   * The bundled compiler is a bootstrapper: it can run `init` (and `--version`/`--help`/`format`)
   * with no project on disk, but it does NOT bundle the standard library, so `compile` requires a
   * project-local `@typespec/compiler`. When there is none, fail early with clear guidance instead
   * of a confusing "cannot find standard library" error.
   */
  async function runBundledCompiler() {
    requireLocalCompilerForCompile();

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sea = require("node:sea");
    if (!sea.isSea()) {
      throw new Error(
        "The bundled compiler is only available when running the standalone TypeSpec executable.",
      );
    }

    const compilerSource = sea.getAsset("compiler.mjs", "utf8") as string;
    serveFromMemory(COMPILER_SPECIFIER, COMPILER_URL, {
      format: "module",
      source: compilerSource,
    });
    await importExternal(COMPILER_SPECIFIER);
  }

  /**
   * The bundled compiler cannot compile without the standard library, which is only available from a
   * project-local `@typespec/compiler`. If the user is invoking `tsp compile` with no local compiler
   * installed, print actionable guidance and exit rather than letting the compiler fail deep inside
   * standard-library loading.
   */
  function requireLocalCompilerForCompile() {
    const cliArgs = process.argv.slice(2);
    const command = cliArgs.find((arg) => !arg.startsWith("-"));
    const wantsHelp = cliArgs.includes("--help") || cliArgs.includes("-h");
    if (command === "compile" && !wantsHelp) {
      // eslint-disable-next-line no-console
      console.error(
        "error: `tsp compile` requires a project-local `@typespec/compiler`, which was not found.\n" +
          "The standalone `tsp` does not bundle the standard library. Run `tsp install` in your " +
          "project (or `tsp init` to create one) and try again.",
      );
      process.exit(1);
    }
  }
}
