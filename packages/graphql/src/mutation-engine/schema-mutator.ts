import {
  isArrayModelType,
  navigateTypesInNamespace,
  type Enum,
  type Model,
  type Namespace,
  type Operation,
  type Program,
  type Scalar,
  type Type,
  type Union,
} from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
import { reportDiagnostic } from "../lib.js";
import { GraphQLTypeUsage, type TypeUsageResolver } from "../type-usage.js";
import type { GraphQLMutationEngine } from "./engine.js";
import { GraphQLTypeContext } from "./options.js";
import { buildTypeGraph, type TypeGraph } from "./type-graph.js";

/**
 * Walk every type in the schema namespace, mutate it through the GraphQL
 * mutation engine, and package the results into a TypeGraph.
 *
 * Filtering (unreachable types, array models, nullable unions) happens here
 * so the engine only processes types that belong in the schema.
 *
 * Models used as both input and output get two mutations (Output and Input),
 * producing separate entries in the TypeGraph (e.g., `Book` and `BookInput`).
 */
export function mutateSchema(
  program: Program,
  engine: GraphQLMutationEngine,
  schema: Namespace,
  typeUsage: TypeUsageResolver,
): TypeGraph {
  const tk = $(program);
  const mutatedTypes: Type[] = [];

  navigateTypesInNamespace(schema, {
    model: (node: Model) => {
      if (isArrayModelType(node)) return;
      if (typeUsage.isUnreachable(node)) return;

      const usage = typeUsage.getUsage(node);
      const usedAsOutput = usage?.has(GraphQLTypeUsage.Output) ?? false;
      const usedAsInput = usage?.has(GraphQLTypeUsage.Input) ?? false;

      if (usedAsOutput || !usage) {
        const mutation = engine.mutateModel(node, GraphQLTypeContext.Output);
        mutatedTypes.push(mutation.mutatedType);
      }
      if (usedAsInput) {
        const mutation = engine.mutateModel(node, GraphQLTypeContext.Input);
        mutatedTypes.push(mutation.mutatedType);
      }
    },
    enum: (node: Enum) => {
      if (typeUsage.isUnreachable(node)) return;

      const mutation = engine.mutateEnum(node);
      mutatedTypes.push(mutation.mutatedType);
    },
    scalar: (node: Scalar) => {
      if (typeUsage.isUnreachable(node)) return;
      const mutation = engine.mutateScalar(node);
      mutatedTypes.push(mutation.mutatedType);
    },
    union: (node: Union) => {
      if (typeUsage.isUnreachable(node)) return;

      const mutation = engine.mutateUnion(node, GraphQLTypeContext.Output);
      mutatedTypes.push(mutation.mutatedType);
      for (const wrapper of mutation.wrapperModels) {
        mutatedTypes.push(wrapper);
      }
    },
    operation: (node: Operation) => {
      const mutation = engine.mutateOperation(node);
      mutatedTypes.push(mutation.mutatedType);
    },
  });

  const seen = new Map<string, Type>();
  for (const type of mutatedTypes) {
    if (!("name" in type) || !type.name) continue;
    const name = type.name as string;
    if (seen.has(name)) {
      reportDiagnostic(program, {
        code: "type-name-collision",
        format: { name },
        target: type,
      });
    } else {
      seen.set(name, type);
    }
  }

  return buildTypeGraph(program, tk, mutatedTypes);
}
