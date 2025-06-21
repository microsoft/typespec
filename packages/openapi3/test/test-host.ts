import { Diagnostic, interpolatePath, resolvePath } from "@typespec/compiler";
import {
  createTester,
  expectDiagnosticEmpty,
  resolveVirtualPath,
} from "@typespec/compiler/testing";
import { ok } from "assert";
import { parse } from "yaml";
import { OpenAPI3EmitterOptions } from "../src/lib.js";
import { OpenAPI3Document } from "../src/types.js";

export const ApiTester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: [
    "@typespec/http",
    "@typespec/json-schema",
    "@typespec/rest",
    "@typespec/versioning",
    "@typespec/openapi",
    "@typespec/xml",
    "@typespec/openapi3",
  ],
});

export const SimpleTester = ApiTester.import(
  "@typespec/http",
  "@typespec/json-schema",
  "@typespec/rest",
  "@typespec/openapi",
  "@typespec/xml",
  "@typespec/openapi3",
)
  .using("Http", "Rest", "OpenAPI", "Xml")
  .emit("@typespec/openapi3");

export const TesterWithVersioning = ApiTester.importLibraries()
  .using("Http", "Rest", "OpenAPI", "Xml", "Versioning")
  .emit("@typespec/openapi3");

export async function emitOpenApiWithDiagnostics(
  code: string,
  options: OpenAPI3EmitterOptions = {},
): Promise<[OpenAPI3Document, readonly Diagnostic[], string]> {
  const runner = await SimpleTester.createInstance();
  const fileType = options["file-type"] || "yaml";
  const outputFile = resolveVirtualPath("openapi" + fileType === "json" ? ".json" : ".yaml");
  const diagnostics = await runner.diagnose(code, {
    compilerOptions: {
      options: {
        "@typespec/openapi3": { ...options, "output-file": outputFile },
      },
    },
  });
  const content = runner.fs.fs.get(outputFile);
  ok(content, "Expected to have found openapi output");
  const doc = fileType === "json" ? JSON.parse(content) : parse(content);
  return [doc, diagnostics, content];
}

export async function diagnoseOpenApiFor(code: string, options: OpenAPI3EmitterOptions = {}) {
  const diagnostics = await SimpleTester.diagnose(code, {
    compilerOptions: { options: { "@typespec/openapi3": options as any } },
  });
  return diagnostics;
}

export async function openApiFor(code: string, options: OpenAPI3EmitterOptions = {}) {
  const host = await SimpleTester.createInstance();
  const outPath = "{emitter-output-dir}/openapi.json";
  const { outputs } = await host.compile(code, {
    compilerOptions: {
      options: { "@typespec/openapi3": { ...options, "output-file": outPath } },
    },
  });

  return JSON.parse(outputs["openapi.json"]);
}

export async function openApiForVersions<T extends string>(
  code: string,
  versions: T[],
): Promise<Record<T, OpenAPI3Document>> {
  const host = await TesterWithVersioning.createInstance();
  const outPath = "{emitter-output-dir}/{version}.openapi.json";
  const { outputs } = await host.compile(code, {
    compilerOptions: {
      options: { "@typespec/openapi3": { "output-file": outPath } },
    },
  });

  const output: Record<T, OpenAPI3Document> = {} as any;
  for (const version of versions) {
    output[version] = JSON.parse(outputs[interpolatePath(outPath, { version: version })]!);
  }
  return output;
}

export async function oapiForModel(
  name: string,
  modelDef: string,
  options: OpenAPI3EmitterOptions = {},
) {
  const oapi = await openApiFor(
    `
    ${modelDef};
    @service(#{title: "Testing model"})
    @route("/")
    namespace root {
      op read(): {
        @header contentType: "application/json";
        @body body: ${name};
      };
    }
  `,
    options,
  );

  const useSchema = oapi.paths["/"].get.responses[200].content["application/json"].schema;

  return {
    isRef: !!useSchema.$ref,
    useSchema,
    schemas: oapi.components.schemas || {},
  };
}

export async function openapiWithOptions(
  code: string,
  options: OpenAPI3EmitterOptions,
): Promise<OpenAPI3Document> {
  const outPath = resolvePath("/openapi.json");

  const runner = await SimpleTester.createInstance();
  const diagnostics = await runner.diagnose(code, {
    compilerOptions: { options: { "@typespec/openapi3": { ...options, "output-file": outPath } } },
  });

  expectDiagnosticEmpty(diagnostics);

  const content = runner.fs.fs.get(outPath)!;
  return JSON.parse(content);
}
