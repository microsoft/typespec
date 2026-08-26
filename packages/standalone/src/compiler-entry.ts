/**
 * ESM entrypoint bundled into the standalone CLI. It builds an in-memory {@link TemplateSource} from
 * the bundled compiler's `tsp init` templates (embedded as a single-executable asset) and runs the
 * compiler CLI with it as the source of built-in templates.
 *
 * This module is bundled to ESM separately from the CommonJS SEA entry (`cli.ts`) because the
 * compiler uses top-level `await`, which a CommonJS single-executable main cannot. The SEA entry
 * loads it from memory through the bridge in `import-workaround.ts` (see `runBundledCompiler` in
 * `cli.ts`).
 */
import { InMemoryTemplateSource, runTypeSpecCli } from "@typespec/compiler/internals/standalone";
import { getAsset, isSea } from "node:sea";

if (!isSea()) {
  throw new Error("The bundled compiler entry must run inside the standalone TypeSpec executable.");
}

// The compiler's `init` templates are embedded as a single-executable asset (a map of
// template-relative path -> contents) and read here from memory.
const files = JSON.parse(getAsset("compiler-assets.json", "utf8") as string) as Record<
  string,
  string
>;

const internalTemplateSource = new InMemoryTemplateSource(new Map(Object.entries(files)));

// Mark the running engine as the standalone `tsp` so the compiler reports its version as
// "<version> standalone" (see `getTypeSpecEngine` in the compiler). Must be set before the CLI reads
// it.
(globalThis as any).TYPESPEC_ENGINE = "tsp";

// A single-executable already provides `process.argv` as `[exe, exe, ...args]`, matching the
// `[runtime, script, ...args]` layout the compiler CLI expects, so no argument adjustment is needed.
await runTypeSpecCli({ internalTemplateSource });
