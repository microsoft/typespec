import {
  emitFile,
  interpolatePath,
  resolvePath,
  type EmitContext,
  type Namespace,
  type Program,
} from "@typespec/compiler";
import { TspContext } from "@typespec/emitter-framework";
import { renderSchema as alloyRenderSchema } from "@pinterest/alloy-graphql";
import { printSchema } from "graphql";
import { Schema } from "./components/schema.js";
import { GraphQLSchemaContext } from "./context/index.js";
import { type GraphQLEmitterOptions } from "./lib.js";
import { getOperationKind } from "./lib/operation-kind.js";
import { listSchemas } from "./lib/schema.js";
import { createGraphQLMutationEngine } from "./mutation-engine/index.js";
import { mutateSchema } from "./mutation-engine/schema-mutator.js";
import type { TypeGraph } from "./mutation-engine/type-graph.js";
import { resolveTypeUsage } from "./type-usage.js";

export async function $onEmit(context: EmitContext<GraphQLEmitterOptions>) {
  const schemas = listSchemas(context.program);
  if (schemas.length === 0) {
    schemas.push({ type: context.program.getGlobalNamespaceType() });
  }

  for (const schema of schemas) {
    const typeGraph = buildSchema(context, schema.type);
    if (typeGraph) {
      const sdl = renderSchema(context.program, typeGraph);
      if (!context.program.compilerOptions.dryRun) {
        const outputFile = context.options["output-file"] ?? "{schema-name}.graphql";
        const fileName = interpolatePath(outputFile, {
          "schema-name": schema.name ?? "schema",
        });
        await emitFile(context.program, {
          path: resolvePath(context.emitterOutputDir, fileName),
          content: sdl,
          newLine: context.options["new-line"] ?? "lf",
        });
      }
    }
  }
}

function buildSchema(
  context: EmitContext<GraphQLEmitterOptions>,
  schema: Namespace,
): TypeGraph | undefined {
  const program = context.program;
  const omitUnreachable = context.options["omit-unreachable-types"] ?? false;

  const typeUsage = resolveTypeUsage(program, schema, omitUnreachable);
  const engine = createGraphQLMutationEngine(program);
  const typeGraph = mutateSchema(program, engine, schema, typeUsage);

  // Check for GraphQL operations - skip generation if none exist
  // (the diagnostic is reported by $onValidate for early IDE feedback)
  const hasGraphQLOps = [...typeGraph.globalNamespace.operations.values()].some(
    (op) => getOperationKind(program, op) !== undefined,
  );
  if (!hasGraphQLOps) {
    return undefined;
  }

  return typeGraph;
}

function renderSchema(program: Program, typeGraph: TypeGraph): string {
  const graphqlSchema = alloyRenderSchema(
    <TspContext.Provider value={{ program }}>
      <GraphQLSchemaContext.Provider value={{ typeGraph }}>
        <Schema />
      </GraphQLSchemaContext.Provider>
    </TspContext.Provider>,
    { namePolicy: null },
  );

  return printSchema(graphqlSchema as any);
}
