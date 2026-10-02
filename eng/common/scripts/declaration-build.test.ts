import { execa } from "execa";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

it.each([
  ["react-components", "dist"],
  ["html-program-viewer", "dist"],
  ["playground", "dist"],
  ["playground-website", "dist/lib"],
  ["spec-dashboard", "dist"],
])(
  "%s emits its exported declarations without JavaScript or test files",
  async (name, outputPath) => {
    const packageDir = join(repoRoot, "packages", name);
    const tempDir = join(packageDir, "temp");
    await mkdir(tempDir, { recursive: true });
    const outDir = await mkdtemp(join(tempDir, "declarations-"));

    try {
      await execa(
        process.execPath,
        [
          join(repoRoot, "node_modules/typescript/bin/tsc"),
          "-p",
          "tsconfig.declaration.json",
          "--outDir",
          outDir,
          "--pretty",
          "false",
        ],
        { cwd: packageDir },
      );

      const manifest: { exports: Record<string, string | { types?: string }> } = JSON.parse(
        await readFile(join(packageDir, "package.json"), "utf-8"),
      );
      const declarations = Object.values(manifest.exports)
        .filter((entry) => typeof entry === "object")
        .map((entry) => entry.types)
        .filter(
          (path): path is string => path !== undefined && path.startsWith(`./${outputPath}/`),
        );
      expect(declarations.length).toBeGreaterThan(0);
      for (const declaration of declarations) {
        const emittedPath = relative(
          join(packageDir, outputPath),
          resolve(packageDir, declaration),
        );
        expect(existsSync(join(outDir, emittedPath)), declaration).toBe(true);
      }

      const files = await readdir(outDir, { recursive: true });
      expect(files.filter((file) => /\.(?:js|jsx)$|\.test\./.test(file))).toEqual([]);
      for (const file of files.filter((file) => file.endsWith(".d.ts"))) {
        const declaration = await readFile(join(outDir, file), "utf-8");
        expect(declaration, file).not.toMatch(/^import\s+["'][^"']+\.css["']/m);
      }
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  },
  60_000,
);
