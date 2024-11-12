import {
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
  resolveVirtualPath,
} from "@typespec/compiler/testing";
import { ok } from "assert";
import { expect } from "vitest";
import type { GraphQLEmitterOptions } from "../src/lib.js";
import { GraphqlTestLibrary } from "../src/testing/index.js";
import { EMPTY_SCHEMA } from "../src/testing/utils.js";
import type { GraphQLSchemaRecord } from "../src/types.js";

export async function createGraphqlTestHost() {
  return createTestHost({
    libraries: [GraphqlTestLibrary],
  });
}

export async function createGraphqlTestRunner() {
  const host = await createGraphqlTestHost();

  return createTestWrapper(host, {
    autoUsings: ["TypeSpec.GraphQL"],
    compilerOptions: {
      noEmit: false,
      emit: ["@typespec/graphql"],
    },
  });
}

export async function emitWithDiagnostics(
  code: string,
  options: GraphQLEmitterOptions = {},
): Promise<readonly GraphQLSchemaRecord[]> {
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
  // Change this to whatever makes sense for the actual GraphQL emitter, probably a GraphQLSchemaRecord
  return [
    {
      graphQLSchema: EMPTY_SCHEMA, // @TODO steverice: Fill in with actual schema
      typeSpecSource: code,
      graphQLOutput: content,
      diagnostics,
    },
  ];
}

export async function emitSingleSchemaWithDiagnostics(
  code: string,
  options: GraphQLEmitterOptions = {},
): Promise<GraphQLSchemaRecord> {
  const schemaRecords = await emitWithDiagnostics(code, options);
  expect(schemaRecords.length).toBe(1);
  return schemaRecords[0];
}

export async function emitSingleSchema(
  code: string,
  options: GraphQLEmitterOptions = {},
): Promise<string> {
  const schemaRecord = await emitSingleSchemaWithDiagnostics(code, options);
  expectDiagnosticEmpty(schemaRecord.diagnostics);
  ok(schemaRecord.graphQLOutput, "Expected to have found graphql output");
  return schemaRecord.graphQLOutput;
}
