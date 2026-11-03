import { renderSchema as alloyRenderSchema } from "@pinterest/alloy-graphql";
import {
  ListenerFlow,
  emitFile,
  interpolatePath,
  isArrayModelType,
  navigateType,
  resolvePath,
  sanitizePathSegment,
  type DiagnosticTarget,
  type EmitContext,
  type Namespace,
  type Operation,
  type Program,
  type Type,
} from "@typespec/compiler";
import { TspContext } from "@typespec/emitter-framework";
import { printSchema } from "graphql";
import { isInputType } from "../generated-defs/TypeSpec.GraphQL.js";
import { Schema } from "./components/schema.js";
import { GraphQLSchemaContext } from "./context/index.js";
import { reportDiagnostic, type GraphQLEmitterOptions } from "./lib.js";
import { isInterface } from "./lib/interface.js";
import { getOperationFields } from "./lib/operation-fields.js";
import { getOperationKind } from "./lib/operation-kind.js";
import { listSchemas } from "./lib/schema.js";
import { createGraphQLMutationEngine } from "./mutation-engine/index.js";
import { mutateSchema } from "./mutation-engine/schema-mutator.js";
import type { TypeGraph } from "./mutation-engine/type-graph.js";
import { resolveTypeUsage } from "./type-usage.js";

/**
 * TypeSpec emitter hook that writes GraphQL SDL for each `@schema` namespace,
 * or for the global namespace when no schema is declared.
 *
 * Schemas without GraphQL operations produce no file. Dry runs still build and
 * render schemas for diagnostics, but do not write output.
 */
export async function $onEmit(context: EmitContext<GraphQLEmitterOptions>) {
  const schemas = listSchemas(context.program);
  const outputFiles = new Set<string>();
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
          "schema-name": sanitizePathSegment(schema.name ?? "schema"),
        });
        const outputFileKey = fileName.normalize("NFC").toLowerCase();
        if (outputFiles.has(outputFileKey)) {
          reportDiagnostic(context.program, {
            code: "output-file-collision",
            format: { path: fileName },
            target: schema.type,
          });
          continue;
        }
        outputFiles.add(outputFileKey);
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

  if (!validateTypeReferences(program, typeGraph)) {
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

function validateTypeReferences(program: Program, typeGraph: TypeGraph): boolean {
  let valid = true;
  const operations = new Set<Operation>();
  const namespace = typeGraph.globalNamespace;
  for (const model of namespace.models.values()) {
    for (const property of model.properties.values()) {
      validate(property.type, property);
    }
    if (!isInputType(program, model) && !isInterface(program, model)) {
      for (const operation of getOperationFields(program, model)) {
        validateOperation(operation);
      }
    }
  }
  for (const operation of namespace.operations.values()) {
    if (getOperationKind(program, operation) !== undefined) {
      validateOperation(operation);
    }
  }
  return valid;

  function validate(type: Type, target: DiagnosticTarget) {
    navigateType(
      type,
      {
        model: (model) => (isArrayModelType(model) ? undefined : ListenerFlow.NoRecursion),
        scalar: (scalar) => {
          if (program.checker.isStdType(scalar, "TypeRef")) {
            reportDiagnostic(program, { code: "type-reference-not-supported", target });
            valid = false;
          }
        },
      },
      {},
    );
  }

  function validateOperation(operation: Operation) {
    if (operations.has(operation)) return;
    operations.add(operation);
    for (const parameter of operation.parameters.properties.values()) {
      validate(parameter.type, parameter);
    }
    validate(operation.returnType, operation);
  }
}
