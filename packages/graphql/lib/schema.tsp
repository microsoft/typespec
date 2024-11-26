import "../dist/src/lib/schema.js";

using TypeSpec.Reflection;

namespace TypeSpec.GraphQL;

namespace Schema {
  model SchemaOptions {
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
