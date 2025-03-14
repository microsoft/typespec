import type { Diagnostic, Operation } from "@typespec/compiler";
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

/**
 * Specify the GraphQL operation type for the target operation to be `MUTATION`.
 *
 * @example
 * ```typespec
 * @mutation op update(): string
 * ```
 */
export type MutationDecorator = (
  context: DecoratorContext,
  target: Operation,
) => void;

/**
 * Specify the GraphQL operation type for the target operation to be `QUERY`.
 *
 * @example
 * ```typespec
 * @query op get(): string
 * ```
 */
export type QueryDecorator = (
  context: DecoratorContext,
  target: Operation,
) => void;

/**
 * Specify the GraphQL operation type for the target operation to be `SUBSCRIPTION`.
 *
 * @example
 * ```typespec
 * @subscription op subscribe(): string
 * ```
 */
export type SubscriptionDecorator = (
  context: DecoratorContext,
  target: Operation,
) => void;
