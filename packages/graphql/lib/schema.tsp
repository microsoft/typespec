import "../dist/src/lib/schema.js";

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
 *
 * @example
 *
 * ```typespec
 * @schema(#{name: "MySchema"})
 * namespace MySchema {};
 * ```
 */
extern dec schema(target: Namespace, options?: valueof Schema.SchemaOptions);
