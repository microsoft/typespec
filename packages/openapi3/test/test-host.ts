import { Diagnostic, interpolatePath, resolvePath } from "@typespec/compiler";
import {
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
  resolveVirtualPath,
} from "@typespec/compiler/testing";
import { HttpTestLibrary } from "@typespec/http/testing";
import { JsonSchemaTestLibrary } from "@typespec/json-schema/testing";
import { OpenAPITestLibrary } from "@typespec/openapi/testing";
import { RestTestLibrary } from "@typespec/rest/testing";
import { VersioningTestLibrary } from "@typespec/versioning/testing";
import { XmlTestLibrary } from "@typespec/xml/testing";
import { ok } from "assert";
import { parse } from "yaml";
import { OpenAPI3EmitterOptions } from "../src/lib.js";
import { OpenAPI3TestLibrary } from "../src/testing/index.js";
import { OpenAPI3Document } from "../src/types.js";

export async function createOpenAPITestHost() {
  return createTestHost({
    libraries: [
      HttpTestLibrary,
      JsonSchemaTestLibrary,
      RestTestLibrary,
      VersioningTestLibrary,
      XmlTestLibrary,
      OpenAPITestLibrary,
      OpenAPI3TestLibrary,
    ],
  });
}

export async function createOpenAPITestRunner({
  emitterOptions,
  withVersioning,
}: { withVersioning?: boolean; emitterOptions?: OpenAPI3EmitterOptions } = {}) {
  const host = await createOpenAPITestHost();
  const importAndUsings = `
  import "@typespec/http";
  import "@typespec/rest";
  import "@typespec/json-schema";
  import "@typespec/openapi";
  import "@typespec/openapi3"; 
  import "@typespec/xml";
  ${withVersioning ? `import "@typespec/versioning"` : ""};
  using Rest;
  using Http;
  using OpenAPI;
  using TypeSpec.Xml;
  ${withVersioning ? "using Versioning;" : ""}
`;
  return createTestWrapper(host, {
    wrapper: (code) => `${importAndUsings} ${code}`,
    compilerOptions: {
      emit: ["@typespec/openapi3"],
      options: {
        "@typespec/openapi3": { ...emitterOptions },
      },
    },
  });
}

export async function emitOpenApiWithDiagnostics(
  code: string,
  options: OpenAPI3EmitterOptions = {},
): Promise<[OpenAPI3Document, readonly Diagnostic[], string]> {
  const runner = await createOpenAPITestRunner();
  const fileType = options["file-type"] || "yaml";
  const outputFile = resolveVirtualPath("openapi" + fileType === "json" ? ".json" : ".yaml");
  const diagnostics = await runner.diagnose(code, {
    emit: ["@typespec/openapi3"],
    options: {
      "@typespec/openapi3": { ...options, "output-file": outputFile },
    },
  });
  const content = runner.fs.get(outputFile);
  ok(content, "Expected to have found openapi output");
  const doc = fileType === "json" ? JSON.parse(content) : parse(content);
  return [doc, diagnostics, content];
}

export async function diagnoseOpenApiFor(code: string, options: OpenAPI3EmitterOptions = {}) {
  const runner = await createOpenAPITestRunner();
  const diagnostics = await runner.diagnose(code, {
    emit: ["@typespec/openapi3"],
    options: { "@typespec/openapi3": options as any },
  });
  return diagnostics;
}

export async function openApiFor(
  code: string,
  versions?: string[],
  options: OpenAPI3EmitterOptions = {},
) {
  const host = await createOpenAPITestHost();
  const outPath = resolveVirtualPath("{version}.openapi.json");
  host.addTypeSpecFile(
    "./main.tsp",
    `import "@typespec/http"; import "@typespec/json-schema"; import "@typespec/rest"; import "@typespec/openapi"; import "@typespec/openapi3";import "@typespec/xml"; ${
      versions ? `import "@typespec/versioning"; using Versioning;` : ""
    }using Rest;using Http;using OpenAPI;using TypeSpec.Xml;${code}`,
  );
  const diagnostics = await host.diagnose("./main.tsp", {
    noEmit: false,
    emit: ["@typespec/openapi3"],
    options: { "@typespec/openapi3": { ...options, "output-file": outPath } },
  });
  expectDiagnosticEmpty(diagnostics);

  if (!versions) {
    return JSON.parse(host.fs.get(resolveVirtualPath("openapi.json"))!);
  } else {
    const output: any = {};
    for (const version of versions) {
      output[version] = JSON.parse(host.fs.get(interpolatePath(outPath, { version: version }))!);
    }
    return output;
  }
}

export async function checkFor(code: string, options: OpenAPI3EmitterOptions = {}) {
  const host = await createOpenAPITestRunner();
  return await host.diagnose(code, {
    dryRun: true,
    emit: ["@typespec/openapi3"],
    options: { "@typespec/openapi3": { ...options } },
  });
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
    undefined,
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
  const runner = await createOpenAPITestRunner();

  const outPath = resolvePath("/openapi.json");

  const diagnostics = await runner.diagnose(code, {
    emit: ["@typespec/openapi3"],
    options: { "@typespec/openapi3": { ...options, "output-file": outPath } },
  });

  expectDiagnosticEmpty(diagnostics);

  const content = runner.fs.get(outPath)!;
  return JSON.parse(content);
}
