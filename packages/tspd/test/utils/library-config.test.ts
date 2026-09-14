import { compile } from "@typespec/compiler";
import { createTestHost, resolveVirtualPath, type TestHost } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it } from "vitest";
import { resolveLibraryCompilerOptions } from "../../src/utils/library-config.js";

describe("resolveLibraryCompilerOptions", () => {
  let host: TestHost;
  const entrypoint = resolveVirtualPath("main.tsp");

  beforeEach(async () => {
    host = await createTestHost();
    host.addTypeSpecFile(
      "main.tsp",
      `
      namespace TestLib;
      auto dec myFlag(target: unknown);
    `,
    );
  });

  async function compileLibrary() {
    const options = await resolveLibraryCompilerOptions(host.compilerHost, entrypoint);
    return await compile(host.compilerHost, entrypoint, options);
  }

  it("enables the features the library opted into in its own tspconfig.yaml", async () => {
    host.addTypeSpecFile("tspconfig.yaml", `features:\n  - auto-decorators\n`);

    const program = await compileLibrary();

    expect(program.diagnostics.map((x) => x.code)).toEqual([]);
  });

  it("reports the feature as disabled when the library did not opt in", async () => {
    const program = await compileLibrary();

    expect(program.diagnostics.map((x) => x.code)).toContain("auto-decorator-disabled");
  });

  it("never emits, even if the library configures emitters", async () => {
    host.addTypeSpecFile("tspconfig.yaml", `emit:\n  - some-emitter\n`);

    const options = await resolveLibraryCompilerOptions(host.compilerHost, entrypoint);

    expect(options.noEmit).toBe(true);
  });

  it("resolves without a tspconfig.yaml", async () => {
    const options = await resolveLibraryCompilerOptions(host.compilerHost, entrypoint);

    expect(options.noEmit).toBe(true);
  });
});
