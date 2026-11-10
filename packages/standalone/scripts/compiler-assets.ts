import { readdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";

/** Resolve the root directory of the `@typespec/compiler` package used by this build. */
export function resolveCompilerRoot(): string {
  const require = createRequire(import.meta.url);
  return dirname(require.resolve("@typespec/compiler/package.json"));
}

async function collectFiles(dir: string, root: string, out: Record<string, string>) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(abs, root, out);
    } else {
      // Keys are POSIX paths relative to the templates root, as InMemoryTemplateSource expects.
      out[relative(root, abs).split("\\").join("/")] = await readFile(abs, "utf8");
    }
  }
}

/**
 * Collect the compiler's `init` template files into a map of POSIX-relative-path -> file contents,
 * suitable for embedding as a single-executable asset.
 *
 * Only the `tsp init` templates are bundled. The compiler's standard library is intentionally NOT
 * bundled: the bundled compiler is a bootstrapper (`init`, `--version`, `--help`, `format`), and any
 * command that needs the standard library (i.e. `compile`) always runs through a project-local
 * `@typespec/compiler` install instead.
 */
export async function collectCompilerAssets(compilerRoot: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  const templatesRoot = join(compilerRoot, "templates");
  await collectFiles(templatesRoot, templatesRoot, files);
  return files;
}

/** Write the collected compiler assets to a JSON file. */
export async function writeCompilerAssets(compilerRoot: string, outFile: string): Promise<number> {
  const files = await collectCompilerAssets(compilerRoot);
  await writeFile(outFile, JSON.stringify(files), "utf8");
  return Object.keys(files).length;
}
