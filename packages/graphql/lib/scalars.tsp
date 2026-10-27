namespace TypeSpec.GraphQL;

/**
 * Represents a GraphQL ID scalar — a unique identifier serialized as a string.
 *
 * @see https://spec.graphql.org/September2025/#sec-ID
 *
 * @example
 *
 * ```typespec
 * model User {
 *   id: GraphQL.ID;
 *   name: string;
 * }
 * ```
 */
scalar ID extends string;
