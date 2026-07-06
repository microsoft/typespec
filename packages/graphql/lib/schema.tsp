using TypeSpec.Reflection;

namespace TypeSpec.GraphQL;

namespace Schema {
  /** Options for configuring a GraphQL schema. */
  model SchemaOptions {
    /**
     * The name of the GraphQL schema. Used in the output filename when emitting
     * multiple schemas (e.g., `{name}.graphql`). Defaults to `"schema"`.
     */
    name?: string;
  }
}

/**
 * Mark this namespace as describing a GraphQL schema and configure schema properties.
 * All types and operations within the namespace will be emitted to a single GraphQL schema file.
 *
 * @example
 *
 * ```typespec
 * @schema(#{ name: "MyAPI" })
 * namespace MyAPI {
 *   model User { id: string; name: string; }
 *   @query op getUser(id: string): User;
 * }
 * // Emits: MyAPI.graphql
 * ```
 */
extern dec schema(target: Namespace, options?: valueof Schema.SchemaOptions);
