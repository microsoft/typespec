import { expect, it } from "vitest";
import type { TypeSpecConfig } from "../../src/config/types.js";
import type { CompilerOptions } from "../../src/core/options.js";
import {
  createTestHost,
  expectDiagnostics,
  resolveVirtualPath,
  type TestHost,
} from "../../src/testing/index.js";

const libFeaturesConfig: TypeSpecConfig = {
  projectRoot: resolveVirtualPath("node_modules/my-lib"),
  kind: "project",
  features: ["auto-decorators"],
  diagnostics: [],
  outputDir: "tsp-output",
};

/** Add a virtual `my-lib` library that declares an `auto` decorator. */
function addAutoDecoratorLibrary(host: TestHost, config?: TypeSpecConfig) {
  host.addTypeSpecFile(
    resolveVirtualPath("node_modules/my-lib/package.json"),
    JSON.stringify({ name: "my-lib", tspMain: "main.tsp", main: "main.tsp" }),
  );
  host.addTypeSpecFile(
    resolveVirtualPath("node_modules/my-lib/main.tsp"),
    `namespace MyLib;
    auto dec myFlag(target: unknown);`,
  );
  if (config) {
    host.addTypeSpecFile(
      resolveVirtualPath("node_modules/my-lib/tspconfig.yaml"),
      `kind: project
features:
${config.features?.map((f) => `  - ${f}`).join("\n") ?? ""}`,
    );
  }
}

/** Root project config enabling the given features for the consumer's own files. */
function projectOptions(features: string[]): CompilerOptions {
  return {
    configFile: {
      projectRoot: ".",
      kind: "project",
      features,
      diagnostics: [],
      outputDir: "tsp-output",
    },
  };
}

it("library can declare an auto decorator by enabling the feature in its own tspconfig.yaml", async () => {
  const host = await createTestHost();
  addAutoDecoratorLibrary(host, libFeaturesConfig);
  host.addTypeSpecFile(
    "main.tsp",
    `import "my-lib";
    using MyLib;
    @myFlag model Foo {}`,
  );

  // Consumer does NOT enable the feature; it should still compile.
  const diagnostics = await host.diagnose("main.tsp");
  expect(diagnostics).toHaveLength(0);
});

it("library auto decorator still errors when the library does not enable the feature", async () => {
  const host = await createTestHost();
  addAutoDecoratorLibrary(host); // no tspconfig.yaml -> feature not enabled
  host.addTypeSpecFile(
    "main.tsp",
    `import "my-lib";
    using MyLib;
    @myFlag model Foo {}`,
  );

  const diagnostics = await host.diagnose("main.tsp");
  expectDiagnostics(diagnostics, {
    code: "auto-decorator-disabled",
  });
});

it("feature is scoped per package: enabling it in the consumer project does not enable it for library code", async () => {
  const host = await createTestHost();
  addAutoDecoratorLibrary(host); // library does not opt in
  host.addTypeSpecFile(
    "main.tsp",
    `import "my-lib";
    using MyLib;
    @myFlag model Foo {}`,
  );

  // Consumer enables the feature in its own project config, but that must not
  // enable the feature for the library's source files.
  const diagnostics = await host.diagnose("main.tsp", projectOptions(["auto-decorators"]));
  expectDiagnostics(diagnostics, {
    code: "auto-decorator-disabled",
  });
});
