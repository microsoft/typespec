import type { Diagnostic } from "@typespec/compiler";
import type { GraphQLSchema } from "graphql";

/**
 * A record containing the GraphQL schema corresponding to
 * a particular schema definition.
 */
export interface GraphQLSchemaRecord {
  /** The GraphQLSchema */
  readonly graphQLSchema: GraphQLSchema;

  /** The full source (text) TypeSpec that generated this schema */
  readonly typeSpecSource: string;

  /** The printed GraphQL schema (in GraphQL SDL) that was generated */
  readonly graphQLOutput?: string;

  /** The diagnostics created for this schema */
  readonly diagnostics: readonly Diagnostic[];
}
