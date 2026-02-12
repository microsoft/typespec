import { Diagnostic, Namespace, Program } from "@typespec/compiler";
import {
  createTestHost as coreCreateTestHost,
  expectDiagnosticEmpty,
} from "@typespec/compiler/testing";
import { HttpTestLibrary } from "@typespec/http/testing";
import { OpenAPITestLibrary } from "@typespec/openapi/testing";
import assert from "node:assert";
import { convertOpenAPI3Document } from "../../../src/index.js";
import { OpenAPI3TestLibrary } from "../../../src/testing/index.js";
import {
  OpenAPI3Document,
  OpenAPI3Header,
  OpenAPI3Parameter,
  OpenAPI3RequestBody,
  OpenAPI3Response,
  OpenAPI3Schema,
  Refable,
} from "../../../src/types.js";

function wrapCodeInTest(code: string): string {
  // Find the 1st namespace declaration and decorate it
  const serviceIndex = code.indexOf("@service");
  return `${code.slice(0, serviceIndex)}@test\n${code.slice(serviceIndex)}`;
}

export interface OpenAPI3Options extends Partial<OpenAPI3Document> {
  headers?: Record<string, OpenAPI3Header>;
  responses?: Record<string, OpenAPI3Response>;
  requestBodies?: Record<string, Refable<OpenAPI3RequestBody>>;
  schemas?: Record<string, Refable<OpenAPI3Schema>>;
  parameters?: Record<string, Refable<OpenAPI3Parameter>>;
}

async function createTestHost() {
  return coreCreateTestHost({
    libraries: [HttpTestLibrary, OpenAPITestLibrary, OpenAPI3TestLibrary],
  });
}

export async function validateTsp(code: string) {
  const host = await createTestHost();
  host.addTypeSpecFile("main.tsp", code);
  const [, diagnostics] = await host.compileAndDiagnose("main.tsp");
  expectDiagnosticEmpty(diagnostics);
}

export async function tspForOpenAPI3(props: OpenAPI3Options) {
  const { namespace: TestService, diagnostics } = await compileForOpenAPI3(props);
  expectDiagnosticEmpty(diagnostics);
  return TestService;
}

export async function compileForOpenAPI3(props: OpenAPI3Options): Promise<{
  namespace: Namespace;
  diagnostics: readonly Diagnostic[];
  program: Program;
}> {
  const openApi3Doc = buildOpenAPI3Doc(props);

  const code = await convertOpenAPI3Document(openApi3Doc);
  const testableCode = wrapCodeInTest(code);
  const host = await createTestHost();
  host.addTypeSpecFile("main.tsp", testableCode);

  const [types, diagnostics] = await host.compileAndDiagnose("main.tsp");
  const { TestService } = types;

  assert(
    TestService?.kind === "Namespace",
    `Expected TestService to be a namespace, instead got ${TestService?.kind}`,
  );
  return {
    namespace: TestService,
    diagnostics,
    program: host.program,
  };
}

export async function renderTypeSpecForOpenAPI3(props: OpenAPI3Options): Promise<string> {
  const openApi3Doc = buildOpenAPI3Doc(props);

  return convertOpenAPI3Document(openApi3Doc);
}

function buildOpenAPI3Doc(props: OpenAPI3Options): OpenAPI3Document {
  const { headers, responses, requestBodies, schemas, parameters, ...rest } = props;
  return {
    info: {
      title: "Test Service",
      version: "1.0.0",
    },
    openapi: "3.0.0",
    ...rest,
    paths: rest.paths || {},
    components: {
      headers: {
        ...(headers as any),
      },
      responses: {
        ...(responses as any),
      },
      requestBodies: {
        ...(requestBodies as any),
      },
      schemas: {
        ...(schemas as any),
      },
      parameters: {
        ...(parameters as any),
      },
    },
  };
}
