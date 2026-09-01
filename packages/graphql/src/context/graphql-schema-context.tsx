import { type ComponentContext, createNamedContext, useContext } from "@alloy-js/core";
import type { TypeGraph } from "../mutation-engine/type-graph.js";

export interface GraphQLSchemaContextValue {
  typeGraph: TypeGraph;
}

export const GraphQLSchemaContext: ComponentContext<GraphQLSchemaContextValue> =
  createNamedContext<GraphQLSchemaContextValue>("GraphQLSchema");

export function useGraphQLSchema(): GraphQLSchemaContextValue {
  const context = useContext(GraphQLSchemaContext);

  if (!context) {
    throw new Error("useGraphQLSchema must be used within GraphQLSchemaContext.Provider.");
  }

  return context;
}
