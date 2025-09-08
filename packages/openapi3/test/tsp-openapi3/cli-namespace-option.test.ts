import { strictEqual } from "node:assert";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "vitest";
import { convertAction } from "../../src/cli/actions/convert/convert-file.js";
import { createCliHost } from "../../src/cli/utils.js";

describe("CLI namespace option", () => {
  const testOpenAPIDocument = JSON.stringify({
    info: {
      title: "CLI Test Service - With Special Characters!",
      version: "1.0.0",
    },
    openapi: "3.0.0",
    paths: {
      "/test": {
        get: {
          operationId: "test",
          responses: {
            "200": {
              description: "Success",
            },
          },
        },
      },
    },
  });

  it("should use custom namespace when --namespace option is provided", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "tsp-openapi3-test-"));
    const inputFile = join(tempDir, "input.json");
    const outputDir = join(tempDir, "output");

    try {
      // Write test OpenAPI document
      await writeFile(inputFile, testOpenAPIDocument);

      // Run conversion with custom namespace
      const host = createCliHost();
      await convertAction(host, {
        path: inputFile,
        "output-dir": outputDir,
        namespace: "CustomCLINamespace",
      });

      // Read generated TypeSpec
      const outputFile = join(outputDir, "main.tsp");
      const generatedContent = await readFile(outputFile, "utf-8");

      // Should use custom namespace
      strictEqual(generatedContent.includes("namespace CustomCLINamespace;"), true);
      // Should still preserve original service title
      strictEqual(generatedContent.includes('title: "CLI Test Service - With Special Characters!"'), true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should use default namespace when no --namespace option is provided", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "tsp-openapi3-test-"));
    const inputFile = join(tempDir, "input.json");
    const outputDir = join(tempDir, "output");

    try {
      // Write test OpenAPI document
      await writeFile(inputFile, testOpenAPIDocument);

      // Run conversion without custom namespace
      const host = createCliHost();
      await convertAction(host, {
        path: inputFile,
        "output-dir": outputDir,
      });

      // Read generated TypeSpec
      const outputFile = join(outputDir, "main.tsp");
      const generatedContent = await readFile(outputFile, "utf-8");

      // Should use generated namespace from title
      strictEqual(generatedContent.includes("namespace CLITestServiceWithSpecialCharacters;"), true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should clean up special characters in custom namespace via CLI", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "tsp-openapi3-test-"));
    const inputFile = join(tempDir, "input.json");
    const outputDir = join(tempDir, "output");

    try {
      // Write test OpenAPI document
      await writeFile(inputFile, testOpenAPIDocument);

      // Run conversion with namespace containing special characters
      const host = createCliHost();
      await convertAction(host, {
        path: inputFile,
        "output-dir": outputDir,
        namespace: "My CLI - Namespace! With Special Characters",
      });

      // Read generated TypeSpec
      const outputFile = join(outputDir, "main.tsp");
      const generatedContent = await readFile(outputFile, "utf-8");

      // Should clean up special characters
      strictEqual(generatedContent.includes("namespace MyCLINamespaceWithSpecialCharacters;"), true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});