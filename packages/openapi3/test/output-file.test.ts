import { resolvePath } from "@typespec/compiler";
import {
  expectDiagnosticEmpty,
  resolveVirtualPath,
  TesterInstance,
} from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { OpenAPI3EmitterOptions } from "../src/lib.js";
import { ApiTester } from "./test-host.js";

describe("openapi3: output file", () => {
  const expectedJsonEmptySpec = [
    "{",
    `  "openapi": "3.0.0",`,
    `  "info": {`,
    `    "title": "(title)",`,
    `    "version": "0.0.0"`,
    `  },`,
    `  "tags": [],`,
    `  "paths": {},`,
    `  "components": {}`,
    "}",
    "",
  ];

  const expectedYamlEmptySpec = [
    `openapi: 3.0.0`,
    `info:`,
    `  title: (title)`,
    `  version: 0.0.0`,
    `tags: []`,
    `paths: {}`,
    `components: {}`,
    "",
  ];

  const outputDir = resolveVirtualPath("test-output");
  let runner: TesterInstance;
  beforeEach(async () => {
    runner = await ApiTester.importLibraries().createInstance();
  });
  async function compileOpenAPI(options: OpenAPI3EmitterOptions, code: string = ""): Promise<void> {
    const diagnostics = await runner.diagnose(code, {
      compilerOptions: {
        emit: ["@typespec/openapi3"],
        options: { "@typespec/openapi3": { ...options, "emitter-output-dir": outputDir } },
      },
    });

    expectDiagnosticEmpty(diagnostics);
  }

  function expectOutput(
    filename: string,
    lines: string[] = expectedYamlEmptySpec,
    newLine: "\n" | "\r\n" = "\n",
  ) {
    const outPath = resolvePath(outputDir, filename);
    const content = runner.fs.fs.get(outPath);
    ok(content, `Expected ${outPath} to exist.`);
    strictEqual(content, lines.join(newLine));
  }

  function expectHasOutput(filename: string) {
    const outPath = resolvePath(outputDir, filename);
    const content = runner.fs.fs.get(outPath);
    ok(content, `Expected ${outPath} to exist.`);
  }

  describe("line endings", () => {
    it("emit LF line endings by default", async () => {
      await compileOpenAPI({});
      expectOutput("openapi.yaml", expectedYamlEmptySpec, "\n");
    });

    it("emit CRLF when configured", async () => {
      await compileOpenAPI({ "new-line": "crlf" });
      expectOutput("openapi.yaml", expectedYamlEmptySpec, "\r\n");
    });
  });

  describe("file-type", () => {
    it("default to yaml", async () => {
      await compileOpenAPI({});
      expectOutput("openapi.yaml", expectedYamlEmptySpec);
    });

    it("emit json when set to json and change output-file to openapi.json", async () => {
      await compileOpenAPI({ "file-type": "json" });
      expectOutput("openapi.json", expectedJsonEmptySpec);
    });

    it("emit json if output-file has .json extension", async () => {
      await compileOpenAPI({ "output-file": "custom.json" });
      expectOutput("custom.json", expectedJsonEmptySpec);
    });

    it("respect file-type even if output-file extension contradict", async () => {
      await compileOpenAPI({ "output-file": "custom.yaml", "file-type": "json" });
      expectOutput("custom.yaml", expectedJsonEmptySpec);
    });
  });

  describe("multiple outputs", () => {
    (["json", "yaml"] as const).forEach((fileType) => {
      describe(`when file-type is ${fileType}`, () => {
        it("create distinct files for distinct services", async () => {
          await compileOpenAPI(
            { "file-type": fileType },
            `
          @service namespace Service1 {}
          @service namespace Service2 {}
        `,
          );
          expectHasOutput(`openapi.Service1.${fileType}`);
          expectHasOutput(`openapi.Service2.${fileType}`);
        });

        it("create distinct files for distinct versions", async () => {
          await compileOpenAPI(
            { "file-type": fileType },
            `
            using Versioning;

          @versioned(Versions) @service namespace Service1 {
            enum Versions {v1, v2}
          }
        `,
          );

          expectHasOutput(`openapi.v1.${fileType}`);
          expectHasOutput(`openapi.v2.${fileType}`);
        });
      });
    });
  });

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
      await compileOpenAPI(
        {
          "output-file": c.outputFilePattern,
        },
        c.code,
      );
      for (const outputFile of c.expectedOutputFiles) expectHasOutput(outputFile);
    });
  });
});
