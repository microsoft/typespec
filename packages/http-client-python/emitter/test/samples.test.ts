import { expectDiagnostics } from "@typespec/compiler/testing";
import { mkdtemp, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { expect, it } from "vitest";
import { EmitterTester } from "./test-host.js";

it.each([
  ["", "resource"],
  ['@clientName("topic", "python")', "topic"],
])(
  "preserves REST body example values with %s",
  async (decorator, clientName) => {
    const outputDir = await mkdtemp(join(tmpdir(), "typespec-python-sample-"));
    try {
      const [, diagnostics] = await EmitterTester.files({
        "examples/create-topic.json": JSON.stringify({
          operationId: "createTopic",
          title: "Create a topic",
          parameters: {
            resource: { title: "Product updates", state: "Normal" },
          },
          responses: { "204": {} },
        }),
      }).compileAndDiagnose(
        `
        import "@typespec/http";
        import "@azure-tools/typespec-client-generator-core";
        using TypeSpec.Http;
        using Azure.ClientGenerator.Core;

        @service
        @server("https://example.org", "Example endpoint")
        namespace Test;
        model Topic {
          title: string;
          state: string;
        }
        @route("/topics")
        @post
        op createTopic(@body ${decorator} resource: Topic): void;
      `,
        {
          compilerOptions: {
            options: {
              "@typespec/http-client-python": {
                "emitter-output-dir": outputDir,
                "examples-dir": "./examples",
                "generate-sample": true,
                "generate-test": false,
                flavor: "azure",
              },
            },
          },
        },
      );

      expectDiagnostics(diagnostics, []);
      const sample = await readFile(
        join(outputDir, "generated_samples", "createtopic.py"),
        "utf-8",
      );
      expect(sample).toContain(`${clientName}={"state": "Normal", "title": "Product updates"}`);
      expect(sample).toContain("# x-ms-original-file: create-topic.json");
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  },
  30_000,
);
