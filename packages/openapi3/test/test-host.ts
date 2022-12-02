import {
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
  resolveVirtualPath,
} from "@cadl-lang/compiler/testing";
import { OpenAPITestLibrary } from "@cadl-lang/openapi/testing";
import { RestTestLibrary } from "@cadl-lang/rest/testing";
import { VersioningTestLibrary } from "@cadl-lang/versioning/testing";
import { OpenAPI3EmitterOptions } from "../src/lib.js";
import { OpenAPI3TestLibrary } from "../src/testing/index.js";

export async function createOpenAPITestHost() {
  return createTestHost({
    libraries: [RestTestLibrary, VersioningTestLibrary, OpenAPITestLibrary, OpenAPI3TestLibrary],
  });
}

export async function createOpenAPITestRunner({
  withVersioning,
}: { withVersioning?: boolean } = {}) {
  const host = await createOpenAPITestHost();
  const importAndUsings = `
  import "@cadl-lang/rest"; import "@cadl-lang/openapi";
  import "@cadl-lang/openapi3"; 
  ${withVersioning ? `import "@cadl-lang/versioning"` : ""};
  using Cadl.Rest;
  using Cadl.Http;
  using OpenAPI;
  ${withVersioning ? "using Cadl.Versioning;" : ""}
`;
  return createTestWrapper(host, {
    wrapper: (code) => `${importAndUsings} ${code}`,
    compilerOptions: {
      emit: ["@cadl-lang/openapi3"],
    },
  });
}

function versionedOutput(path: string, version: string) {
  return path.replace(".json", "." + version + ".json");
}

export async function diagnoseOpenApiFor(code: string, options: OpenAPI3EmitterOptions = {}) {
  const runner = await createOpenAPITestRunner();
  const diagnostics = await runner.diagnose(code, {
    emit: ["@cadl-lang/openapi3"],
    options: { "@cadl-lang/openapi3": options as any },
  });
  return diagnostics.filter((x) => x.code !== "@cadl-lang/rest/no-routes");
}

export async function openApiFor(
  code: string,
  versions?: string[],
  options: OpenAPI3EmitterOptions = {}
) {
  const host = await createOpenAPITestHost();
  const outPath = resolveVirtualPath("openapi.json");
  host.addCadlFile(
    "./main.cadl",
    `import "@cadl-lang/rest"; import "@cadl-lang/openapi"; import "@cadl-lang/openapi3"; ${
      versions ? `import "@cadl-lang/versioning"; using Cadl.Versioning;` : ""
    }using Cadl.Rest;using Cadl.Http;using OpenAPI;${code}`
  );
  const diagnostics = await host.diagnose("./main.cadl", {
    noEmit: false,
    emit: ["@cadl-lang/openapi3"],
    options: { "@cadl-lang/openapi3": { ...options, "output-file": outPath } },
  });
  expectDiagnosticEmpty(diagnostics.filter((x) => x.code !== "@cadl-lang/rest/no-routes"));

  if (!versions) {
    return JSON.parse(host.fs.get(outPath)!);
  } else {
    const output: any = {};
    for (const version of versions) {
      output[version] = JSON.parse(host.fs.get(versionedOutput(outPath, version))!);
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
