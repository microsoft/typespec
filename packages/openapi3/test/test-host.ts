import { interpolatePath } from "@typespec/compiler";
import {
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
  resolveVirtualPath,
} from "@typespec/compiler/testing";
import { HttpTestLibrary } from "@typespec/http/testing";
import { OpenAPITestLibrary } from "@typespec/openapi/testing";
import { RestTestLibrary } from "@typespec/rest/testing";
import { VersioningTestLibrary } from "@typespec/versioning/testing";
import { OpenAPI3EmitterOptions } from "../src/lib.js";
import { OpenAPI3TestLibrary } from "../src/testing/index.js";

export async function createOpenAPITestHost() {
  return createTestHost({
    libraries: [
      HttpTestLibrary,
      RestTestLibrary,
      VersioningTestLibrary,
      OpenAPITestLibrary,
      OpenAPI3TestLibrary,
    ],
  });
}

export async function createOpenAPITestRunner({
  withVersioning,
}: { withVersioning?: boolean } = {}) {
  const host = await createOpenAPITestHost();
  const importAndUsings = `
  import "@typespec/http";
  import "@typespec/rest";
  import "@typespec/openapi";
  import "@typespec/openapi3"; 
  ${withVersioning ? `import "@typespec/versioning"` : ""};
  using TypeSpec.Rest;
  using TypeSpec.Http;
  using TypeSpec.OpenAPI;
  ${withVersioning ? "using TypeSpec.Versioning;" : ""}
`;
  return createTestWrapper(host, {
    wrapper: (code) => `${importAndUsings} ${code}`,
    compilerOptions: {
      emit: ["@typespec/openapi3"],
    },
  });
}

export async function diagnoseOpenApiFor(code: string, options: OpenAPI3EmitterOptions = {}) {
  const runner = await createOpenAPITestRunner();
  const diagnostics = await runner.diagnose(code, {
    emit: ["@typespec/openapi3"],
    options: { "@typespec/openapi3": options as any },
  });
  return diagnostics.filter((x) => x.code !== "@typespec/http/no-routes");
}

export async function openApiFor(
  code: string,
  versions?: string[],
  options: OpenAPI3EmitterOptions = {}
) {
  const host = await createOpenAPITestHost();
  const outPath = resolveVirtualPath("{version}.openapi.json");
  host.addTypeSpecFile(
    "./main.tsp",
    `import "@typespec/http"; import "@typespec/rest"; import "@typespec/openapi"; import "@typespec/openapi3"; ${
      versions ? `import "@typespec/versioning"; using TypeSpec.Versioning;` : ""
    }using TypeSpec.Rest;using TypeSpec.Http;using TypeSpec.OpenAPI;${code}`
  );
  const diagnostics = await host.diagnose("./main.tsp", {
    noEmit: false,
    emit: ["@typespec/openapi3"],
    options: { "@typespec/openapi3": { ...options, "output-file": outPath } },
  });
  expectDiagnosticEmpty(diagnostics.filter((x) => x.code !== "@typespec/http/no-routes"));

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

export async function checkFor(code: string) {
  const host = await createOpenAPITestRunner();
  return await host.diagnose(code);
}

export async function oapiForModel(name: string, modelDef: string) {
  const oapi = await openApiFor(`
    ${modelDef};
    @service({title: "Testing model"})
    @route("/")
    namespace root {
      op read(): { @body body: ${name} };
    }
  `);

  const useSchema = oapi.paths["/"].get.responses[200].content["application/json"].schema;

  return {
    isRef: !!useSchema.$ref,
    useSchema,
    schemas: oapi.components.schemas || {},
  };
}
