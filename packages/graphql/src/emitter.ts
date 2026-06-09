import { type EmitContext, type Namespace } from "@typespec/compiler";
import { type GraphQLEmitterOptions, reportDiagnostic } from "./lib.js";
import { listSchemas } from "./lib/schema.js";
import { createGraphQLMutationEngine } from "./mutation-engine/index.js";
import { mutateSchema } from "./mutation-engine/schema-mutator.js";
import type { TypeGraph } from "./mutation-engine/type-graph.js";
import { resolveTypeUsage } from "./type-usage.js";

/**
 * Main emitter entry point for GraphQL SDL generation.
 *
 * Pipeline: type-usage → mutation → buildTypeGraph → render.
 * Rendering is a stub in this PR — will be implemented when the Schema
 * orchestrator component is added.
 */
export async function $onEmit(context: EmitContext<GraphQLEmitterOptions>) {
  const schemas = listSchemas(context.program);
  if (schemas.length === 0) {
    schemas.push({ type: context.program.getGlobalNamespaceType() });
  }

  for (const schema of schemas) {
    const typeGraph = emitSchema(context, schema.type);
    if (typeGraph) {
      renderSchema(typeGraph, schema.name);
    }
  }
}

function emitSchema(
  context: EmitContext<GraphQLEmitterOptions>,
  schema: Namespace,
): TypeGraph | undefined {
  const program = context.program;
  const omitUnreachable = context.options["omit-unreachable-types"] ?? false;

  const typeUsage = resolveTypeUsage(schema, omitUnreachable);
  const engine = createGraphQLMutationEngine(program);
  const typeGraph = mutateSchema(program, engine, schema, typeUsage);

  if (typeGraph.globalNamespace.operations.size === 0) {
    reportDiagnostic(program, {
      code: "empty-schema",
      target: schema,
    });
    return undefined;
  }

  return typeGraph;
}

function renderSchema(_typeGraph: TypeGraph, _schemaName?: string): void {
  // Stub — will be replaced with Alloy component rendering:
  // <GraphQLSchemaContext.Provider value={{ typeGraph }}>
  //   <Schema />
  // </GraphQLSchemaContext.Provider>
}
