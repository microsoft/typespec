import { ApiTester } from "#test/test-host.js";
import { Diagnostic, Namespace, Program } from "@typespec/compiler";
import { expectDiagnosticEmpty } from "@typespec/compiler/testing";
import assert from "node:assert";
import { convertOpenAPI3Document } from "../../../src/index.js";
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
  // Place a fourslash marker before the namespace identifier so we can extract it
  return code.replace("namespace TestService", "namespace /*TestService*/TestService");
}

export interface OpenAPI3Options extends Partial<OpenAPI3Document> {
  headers?: Record<string, OpenAPI3Header>;
  responses?: Record<string, OpenAPI3Response>;
  requestBodies?: Record<string, Refable<OpenAPI3RequestBody>>;
  schemas?: Record<string, Refable<OpenAPI3Schema>>;
  parameters?: Record<string, Refable<OpenAPI3Parameter>>;
}

export async function validateTsp(code: string) {
  const diagnostics = await ApiTester.diagnose(code);
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

  const [result, diagnostics] = await ApiTester.compileAndDiagnose(testableCode);
  const TestService = result.TestService;
  const { program } = result;

  assert(
    TestService?.entityKind === "Type" && TestService?.kind === "Namespace",
    `Expected TestService to be a namespace, instead got ${TestService?.entityKind}/${(TestService as any)?.kind}`,
  );
  return {
    namespace: TestService as Namespace,
    diagnostics,
    program,
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
