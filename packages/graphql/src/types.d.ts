import type { Diagnostic } from "@typespec/compiler";
import type { GraphQLSchema } from "graphql";
import type { Schema } from "./lib/schema.ts";

/**
 * A record containing the GraphQL schema corresponding to
 * a particular schema definition.
 */
export interface GraphQLSchemaRecord {
  /** The declared schema that generated this GraphQL schema */
  readonly schema: Schema;

  /** The GraphQLSchema */
  readonly graphQLSchema: GraphQLSchema;

  /** The diagnostics created for this schema */
  readonly diagnostics: readonly Diagnostic[];
}
