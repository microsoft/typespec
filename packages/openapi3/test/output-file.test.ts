import { resolvePath } from "@typespec/compiler";
import type { TesterInstance } from "@typespec/compiler/testing";
import { expectDiagnosticEmpty, resolveVirtualPath } from "@typespec/compiler/testing";
import { ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import type { OpenAPI3EmitterOptions } from "../src/lib.js";
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

  describe("multiple file types", () => {
    it("emit both json and yaml when file-type is an array", async () => {
      await compileOpenAPI({ "file-type": ["json", "yaml"] });
      expectOutput("openapi.json", expectedJsonEmptySpec);
      expectOutput("openapi.yaml", expectedYamlEmptySpec);
    });

    it("emit both formats with custom output-file using {file-type}", async () => {
      await compileOpenAPI({
        "file-type": ["json", "yaml"],
        "output-file": "my.spec.{file-type}",
      });
      expectOutput("my.spec.json", expectedJsonEmptySpec);
      expectOutput("my.spec.yaml", expectedYamlEmptySpec);
    });

    it("emit both formats for multiple services", async () => {
      await compileOpenAPI(
        { "file-type": ["json", "yaml"] },
        `
          @service namespace Service1 {}
          @service namespace Service2 {}
        `,
      );
      expectHasOutput("openapi.Service1.json");
      expectHasOutput("openapi.Service2.json");
      expectHasOutput("openapi.Service1.yaml");
      expectHasOutput("openapi.Service2.yaml");
    });

    it("emit both formats for versioned services", async () => {
      await compileOpenAPI(
        { "file-type": ["json", "yaml"] },
        `
          using Versioning;
          @versioned(Versions) @service namespace Service1 {
            enum Versions {v1, v2}
          }
        `,
      );
      expectHasOutput("openapi.v1.json");
      expectHasOutput("openapi.v2.json");
      expectHasOutput("openapi.v1.yaml");
      expectHasOutput("openapi.v2.yaml");
    });

    it("{file-type} variable works with single file-type string", async () => {
      await compileOpenAPI({
        "file-type": "json",
        "output-file": "my.spec.{file-type}",
      });
      expectOutput("my.spec.json", expectedJsonEmptySpec);
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

  describe("sanitize spec provided values", () => {
    it("sanitize path separators and traversal in {version}", async () => {
      await compileOpenAPI(
        { "output-file": "openapi.{version}.yaml" },
        `
          using Versioning;
          @versioned(Versions) @service namespace Service1 {
            enum Versions {v1: "../../../escaped"}
          }
        `,
      );
      expectHasOutput("openapi..._.._.._escaped.yaml");
    });

    it("sanitize {version} used as a directory segment", async () => {
      await compileOpenAPI(
        { "output-file": "{version}/openapi.yaml" },
        `
          using Versioning;
          @versioned(Versions) @service namespace Service1 {
            enum Versions {v1: ".."}
          }
        `,
      );
      expectHasOutput("_/openapi.yaml");
    });

    it("sanitize path separators in {service-name}", async () => {
      await compileOpenAPI(
        { "output-file": "{service-name}.yaml" },
        "@service namespace `../../escaped` {}",
      );
      expectHasOutput(".._.._escaped.yaml");
    });

    it("sanitize path separators in {service-name-if-multiple}", async () => {
      await compileOpenAPI(
        { "output-file": "openapi.{service-name-if-multiple}.yaml" },
        `
          @service namespace \`../../escaped\` {}
          @service namespace Service2 {}
        `,
      );
      expectHasOutput("openapi..._.._escaped.yaml");
      expectHasOutput("openapi.Service2.yaml");
    });

    it("keep benign versions and service names untouched", async () => {
      await compileOpenAPI(
        { "output-file": "{service-name}.{version}.yaml" },
        `
          using Versioning;
          @versioned(Versions) @service namespace Pet.Store {
            enum Versions {v1: "2021-10-01-preview"}
          }
        `,
      );
      expectHasOutput("Pet.Store.2021-10-01-preview.yaml");
    });
  });
});
