import { resolveVirtualPath } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { createOpenAPITestRunner } from "./test-host.js";

describe("Predefined variable name behavior", () => {
  interface ServiceNameCase {
    description: string;
    code: string;
    outputFilePattern: string;
    expectedOutputFiles: string[];
  }
  it.each([
    // {service-name} cases
    {
      description: "{service-name} for one service",
      code: "@service namespace AAA { model M {a: string} }",
      outputFilePattern: "{service-name}.yaml",
      expectedOutputFiles: ["AAA.yaml"],
    },
    {
      description: "{service-name} for multiple services",
      code:
        "@service namespace AAA { model M {a: string} }" +
        "@service namespace BBB { model N {b: string} }",
      outputFilePattern: "{service-name}.yaml",
      expectedOutputFiles: ["AAA.yaml", "BBB.yaml"],
    },
    // {service-name-if-multiple} cases
    {
      description: "{service-name-if-multiple} for one service",
      code: "@service namespace AAA { model M {a: string} }",
      outputFilePattern: "{service-name-if-multiple}.yaml",
      expectedOutputFiles: ["yaml"],
    },
    {
      description: "{service-name-if-multiple} for multiple services",
      code:
        "@service namespace AAA { model M {a: string} }" +
        "@service namespace BBB { model N {b: string} }",
      outputFilePattern: "{service-name-if-multiple}.yaml",
      expectedOutputFiles: ["AAA.yaml", "BBB.yaml"],
    },
    // fixed name cases
    {
      description: "fixed name for one service",
      code: "@service namespace AAA { model M {a: string} }",
      outputFilePattern: "fixed-name.yaml",
      expectedOutputFiles: ["fixed-name.yaml"],
    },
  ])("$description", async (c: ServiceNameCase) => {
    const runner = await createOpenAPITestRunner();
    const diagnostics = await runner.diagnose(c.code, {
      noEmit: false,
      emit: ["@typespec/openapi3"],
      options: {
        "@typespec/openapi3": {
          "output-file": c.outputFilePattern,
          "emitter-output-dir": "{output-dir}",
        },
      },
    });
    expect(diagnostics.length).toBe(0);
    for (const outputFile of c.expectedOutputFiles)
      expect(runner.fs.has(resolveVirtualPath(outputFile))).toBe(true);
  });
});
