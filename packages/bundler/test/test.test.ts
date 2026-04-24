import { mkdir, mkdtemp, rm, writeFile } from "fs/promises";
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

  it("includes typespec source files from sub-exports", async () => {
    const tmpDir = await mkdtemp(join(tmpdir(), "typespec-bundler-test-"));
    try {
      await mkdir(join(tmpDir, "lib", "sub"), { recursive: true });

      await writeFile(
        join(tmpDir, "package.json"),
        JSON.stringify({
          name: "test-lib",
          version: "1.0.0",
          main: "index.js",
          tspMain: "lib/main.tsp",
          peerDependencies: {},
          exports: {
            ".": {
              typespec: "./lib/main.tsp",
              default: "./index.js",
            },
            "./sub": {
              typespec: "./lib/sub/main.tsp",
              default: "./sub.js",
            },
          },
        }),
      );
      await writeFile(
        join(tmpDir, "lib", "main.tsp"),
        ['import "../index.js";', "namespace TestLib;"].join("\n"),
      );
      await writeFile(
        join(tmpDir, "lib", "sub", "main.tsp"),
        [
          'import "../../index.js";',
          "namespace TestLib.Sub;",
          "model SubModel { x: string; }",
        ].join("\n"),
      );
      await writeFile(join(tmpDir, "index.js"), "export function $myDec(context, target) { }");
      await writeFile(join(tmpDir, "sub.js"), "export const subExport = true;");

      const bundle = await createTypeSpecBundle(tmpDir, { minify: false });
      const indexFile = bundle.files.find((f) => f.filename === "index.js");
      expect(indexFile).toBeDefined();

      // The main bundle should include the sub-export's typespec source files
      expect(indexFile!.content).toContain("lib/sub/main.tsp");
      expect(indexFile!.content).toContain("SubModel");

      // The sub-export JS entry should also be bundled
      const subFile = bundle.files.find((f) => f.filename === "sub.js");
      expect(subFile, "sub.js should be in bundle output").toBeDefined();
    } finally {
      await rm(tmpDir, { recursive: true });
    }
  });
});
