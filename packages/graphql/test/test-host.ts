import type { Diagnostic } from "@typespec/compiler";
import {
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
  resolveVirtualPath,
} from "@typespec/compiler/testing";
import { ok } from "assert";
import type { GraphQLEmitterOptions } from "../src/lib.js";
import { GraphqlTestLibrary } from "../src/testing/index.js";

export async function createGraphqlTestHost() {
  return createTestHost({
    libraries: [GraphqlTestLibrary],
  });
}

export async function createGraphqlTestRunner() {
  const host = await createGraphqlTestHost();

  return createTestWrapper(host, {
    compilerOptions: {
      noEmit: false,
      emit: ["@typespec/graphql"],
    },
  });
}

export async function emitWithDiagnostics(
  code: string,
  options: GraphQLEmitterOptions = {},
): Promise<[string, readonly Diagnostic[]]> {
  const runner = await createGraphqlTestRunner();
  const outputFile = resolveVirtualPath("schema.graphql");
  const compilerOptions = { ...options, "output-file": outputFile };
  const diagnostics = await runner.diagnose(code, {
    noEmit: false,
    emit: ["@typespec/graphql"],
    options: {
      "@typespec/graphql": compilerOptions,
    },
  });
  const content = runner.fs.get(outputFile);
  ok(content, "Expected to have found graphql output");
  // Change this to whatever makes sense for the actual GraphQL emitter, probably a GraphQLSchemaRecord
  return [content, diagnostics];
}

export async function emit(code: string, options: GraphQLEmitterOptions = {}): Promise<string> {
  const [result, diagnostics] = await emitWithDiagnostics(code, options);
  expectDiagnosticEmpty(diagnostics);
  return result;
}
