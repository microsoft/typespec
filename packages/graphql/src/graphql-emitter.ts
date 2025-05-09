import {
  emitFile,
  getNamespaceFullName,
  interpolatePath,
  type EmitContext,
} from "@typespec/compiler";
import { printSchema } from "graphql";
import type { ResolvedGraphQLEmitterOptions } from "./emitter.js";
import type { GraphQLEmitterOptions } from "./lib.js";
import { listSchemas } from "./lib/schema.js";
import { createSchemaEmitter } from "./schema-emitter.js";
import type { GraphQLSchemaRecord } from "./types.js";

export function createGraphQLEmitter(
  context: EmitContext<GraphQLEmitterOptions>,
  options: ResolvedGraphQLEmitterOptions,
) {
  const program = context.program;

  return {
    emitGraphQL,
  };

  async function emitGraphQL() {
    if (!program.compilerOptions.noEmit) {
      const schemaRecords = await getGraphQL();
      // first, emit diagnostics
      for (const schemaRecord of schemaRecords) {
        program.reportDiagnostics(schemaRecord.diagnostics);
      }
      if (program.hasError()) {
        return;
      }
      for (const schemaRecord of schemaRecords) {
        const schemaName = getNamespaceFullName(schemaRecord.schema.type) || "schema";
        const filePath = interpolatePath(options.outputFile, {
          "schema-name": schemaName,
        });
        await emitFile(program, {
          path: filePath,
          content: printSchema(schemaRecord.graphQLSchema),
          newLine: options.newLine,
        });
      }
    }
  }

  async function getGraphQL(): Promise<GraphQLSchemaRecord[]> {
    const schemaRecords: GraphQLSchemaRecord[] = [];
    const schemas = listSchemas(program);
    if (schemas.length === 0) {
      schemas.push({ type: program.getGlobalNamespaceType() });
    }
    for (const schema of schemas) {
      const schemaEmitter = createSchemaEmitter(schema, context, options);
      const document = await schemaEmitter.emitSchema();
      if (document === undefined) {
        continue;
      }
      schemaRecords.push({
        schema: schema,
        graphQLSchema: document[0],
        diagnostics: document[1],
      });
    }
    return schemaRecords;
  }
}
