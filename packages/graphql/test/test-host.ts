import { type Diagnostic, resolvePath } from "@typespec/compiler";
import { createTester, expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { ok } from "assert";
import type { GraphQLSchema } from "graphql";
import { buildSchema } from "graphql";
import { expect } from "vitest";
import type { GraphQLEmitterOptions } from "../src/lib.js";

const outputFileName = "schema.graphql";

export const Tester = createTester(resolvePath(import.meta.dirname, ".."), {
  libraries: ["@typespec/graphql"],
})
  .importLibraries()
  .using("TypeSpec.GraphQL");

export const EmitterTester = Tester.emit("@typespec/graphql");

export interface GraphQLTestResult {
  readonly graphQLSchema?: GraphQLSchema;
  readonly graphQLOutput?: string;
  readonly diagnostics: readonly Diagnostic[];
}

export async function emitWithDiagnostics(
  code: string,
  options: GraphQLEmitterOptions = {},
): Promise<readonly GraphQLTestResult[]> {
  const [result, diagnostics] = await EmitterTester.compileAndDiagnose(code, {
    compilerOptions: {
      options: {
        "@typespec/graphql": { ...options, "output-file": outputFileName },
      },
    },
  });

  const content = result.outputs[outputFileName];
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
