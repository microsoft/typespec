import type { Diagnostic, Program, Type } from "@typespec/compiler";
import {
  createTestHost,
  createTestWrapper,
  expectDiagnosticEmpty,
  resolveVirtualPath,
} from "@typespec/compiler/testing";
import { ok } from "assert";
import type { GraphQLSchema } from "graphql";
import { buildSchema } from "graphql";
import { expect } from "vitest";
import type { GraphQLEmitterOptions } from "../src/lib.js";
import { GraphqlTestLibrary } from "../src/testing/index.js";

export async function createGraphqlTestHost() {
  return createTestHost({
    libraries: [GraphqlTestLibrary],
  });
}

export interface GraphQLTestResult {
  readonly graphQLSchema?: GraphQLSchema;
  readonly graphQLOutput?: string;
  readonly diagnostics: readonly Diagnostic[];
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

export async function diagnose(code: string): Promise<readonly Diagnostic[]> {
  const runner = await createGraphqlTestRunner();
  return runner.diagnose(code);
}

export async function compileAndDiagnose<T extends Record<string, Type>>(
  code: string,
): Promise<[Program, T, readonly Diagnostic[]]> {
  const runner = await createGraphqlTestRunner();
  const [testTypes, diagnostics] = await runner.compileAndDiagnose(code);
  return [runner.program, testTypes as T, diagnostics];
}

export async function emitWithDiagnostics(
  code: string,
  options: GraphQLEmitterOptions = {},
): Promise<readonly GraphQLTestResult[]> {
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

  /**
   * There doesn't appear to be a good way to hook into the emit process and get the GraphQLSchema
   * that's produced by the emitter. So we're going to read the file that was emitted and parse it.
   *
   * This is the same way it's done in @typespec/openapi3:
   * https://github.com/microsoft/typespec/blame/1cf8601d0f65f707926d58d56566fb0cb4d4f4ff/packages/openapi3/test/test-host.ts#L105
   */

  const content = runner.fs.get(outputFile);
  const schema = content
    ? buildSchema(content, {
        assumeValidSDL: true,
        noLocation: true,
      })
    : undefined;

  return [
    {
      graphQLSchema: schema,
      graphQLOutput: content,
      diagnostics,
    },
  ];
}

export async function emitSingleSchemaWithDiagnostics(
  code: string,
  options: GraphQLEmitterOptions = {},
): Promise<GraphQLTestResult> {
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
