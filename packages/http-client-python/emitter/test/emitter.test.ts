import { expectDiagnostics, t } from "@typespec/compiler/testing";
import { mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { expect, it } from "vitest";
import { EmitterTester } from "./test-host.js";

it("targets the service namespace when no SDK clients are found", async () => {
  const [, diagnostics] = await EmitterTester.compileAndDiagnose(
    t.code`
    #suppress "@typespec/http-client-python/no-sdk-clients" "This service intentionally has no client."
    @service namespace ${t.namespace("Service")} {}
  `,
    {
      compilerOptions: {
        options: {
          "@typespec/http-client-python": {
            "emit-yaml-only": true,
          },
        },
      },
    },
  );

  expectDiagnostics(diagnostics, []);
});

it("generates models when no service exists", async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "typespec-python-models-"));
  try {
    const [, diagnostics] = await EmitterTester.compileAndDiagnose(
      `
        import "@azure-tools/typespec-client-generator-core";
        using Azure.ClientGenerator.Core;

        #suppress "@typespec/http-client-python/no-sdk-clients" "This model-only package intentionally has no client."
        @access(Access.public)
        @usage(Usage.input | Usage.output)
        @clientNamespace("Models")
        model Widget {}
      `,
      {
        compilerOptions: {
          options: {
            "@typespec/http-client-python": {
              "emitter-output-dir": outputDir,
            },
          },
        },
      },
    );

    expectDiagnostics(diagnostics, []);
    const model = await readFile(
      join(outputDir, "models", "models", "_models.py"),
      "utf-8",
    );
    expect(model).toContain("class Widget");
  } finally {
    await rm(outputDir, { recursive: true, force: true });
  }
}, 30_000);
