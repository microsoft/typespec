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
import { setInputType } from "../lib/input-type.js";
import { isInterface } from "../lib/interface.js";
import { getOperationFields } from "../lib/operation-fields.js";
import { reportDiagnostic } from "../lib.js";
import { createVisibilityFilters } from "../lib/visibility.js";
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
  const filters = createVisibilityFilters(program);

  navigateTypesInNamespace(schema, {
    model: (node: Model) => {
      if (isArrayModelType(node)) return;
      if (typeUsage.isUnreachable(node)) return;

      const usage = typeUsage.getUsage(node);
      const usedAsOutput = usage?.has(GraphQLTypeUsage.Output) ?? false;
      const usedAsInput = usage?.has(GraphQLTypeUsage.Input) ?? false;
      const isInterfaceModel = isInterface(program, node);

      if (isInterfaceModel) {
        const mutation = engine.mutateModel(node, GraphQLTypeContext.Interface);
        mutatedTypes.push(mutation.mutatedType);
      }
      if (!isInterfaceModel && (usedAsOutput || !usage)) {
        const mutation = engine.mutateModel(node, GraphQLTypeContext.Output, filters.output);
        mutatedTypes.push(mutation.mutatedType);
      }
      if (usedAsInput) {
        if (getOperationFields(program, node).size > 0) {
          reportDiagnostic(program, {
            code: "operation-fields-ignored-on-input",
            format: { model: node.name },
            target: node,
          });
        }
        const hasVariance = typeUsage.hasInputOperationVariance(node);
        const usedByQuery = usage?.has(GraphQLTypeUsage.InputQuery) ?? false;
        const usedByMutation = usage?.has(GraphQLTypeUsage.InputMutation) ?? false;

        if (hasVariance) {
          // Different property sets per operation kind — emit both with qualified names.
          const qm = engine.mutateModel(node, GraphQLTypeContext.Input, filters.query, "query", "Query");
          const mm = engine.mutateModel(node, GraphQLTypeContext.Input, filters.mutation, "mutation", "Mutation");
          setInputType(qm.mutatedType);
          setInputType(mm.mutatedType);
          mutatedTypes.push(qm.mutatedType);
          mutatedTypes.push(mm.mutatedType);
        } else {
          // Same property sets — one input type, but create cache entries for each
          // operation kind so operations can resolve their references.
          const emitted = usedByMutation
            ? engine.mutateModel(node, GraphQLTypeContext.Input, filters.mutation, "mutation")
            : engine.mutateModel(node, GraphQLTypeContext.Input, filters.query, "query");
          setInputType(emitted.mutatedType);
          mutatedTypes.push(emitted.mutatedType);

          if (usedByQuery && usedByMutation) {
            setInputType(
              engine.mutateModel(node, GraphQLTypeContext.Input, filters.query, "query").mutatedType,
            );
          }
        }
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
      if (mutation.mutatedType.kind !== "Union") {
        return;
      }
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
