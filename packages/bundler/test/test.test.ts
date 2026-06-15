import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { createTypeSpecBundle } from "../src/bundler.js";

describe("bundler", () => {
  /**
   * Regression test: TypeSpec decorator functions are identified by their `.name` property
   * at runtime (e.g., `d.decorator.name === "$armResourceOperations"`).
   * When esbuild minifies library bundles, it can rename functions, changing their `.name`.
   * The bundler must use `keepNames: true` to preserve function names in minified output.
   */
  it("preserves function names when minifying", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "typespec-bundler-test-"));
    try {
      // Create a minimal TypeSpec library with named decorator function exports
      await writeFile(
        join(tmpDir, "package.json"),
        JSON.stringify({
          name: "test-lib",
          version: "1.0.0",
          main: "index.js",
          tspMain: "main.tsp",
          peerDependencies: {},
        }),
      );
      await writeFile(
        join(tmpDir, "main.tsp"),
        ['import "./index.js";', "namespace TestLib;"].join("\n"),
      );
      await writeFile(
        join(tmpDir, "index.js"),
        [
          "export function $testDecorator(context, target) { }",
          "export function $anotherDecorator(context, target) { }",
        ].join("\n"),
      );

      const bundle = await createTypeSpecBundle(tmpDir, { minify: true });
      const indexFile = bundle.files.find((f) => f.filename === "index.js");
      expect(indexFile, "index.js should be in bundle output").toBeDefined();

      // The bundle's jsSourceFiles should contain modules where the function
      // .name property is preserved. With keepNames, esbuild emits a helper
      // that restores the original name via Object.defineProperty.
      // We verify the original function names appear as string literals in the output.
      expect(indexFile!.content).toContain('"$testDecorator"');
      expect(indexFile!.content).toContain('"$anotherDecorator"');
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
