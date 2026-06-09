import "../dist/src/lib/one-of.js";

using TypeSpec.Reflection;

namespace TypeSpec.GraphQL;

/**
 * Mark a model as a `@oneOf` input object in the emitted GraphQL schema.
 *
 * This decorator is applied automatically by the mutation engine when it converts
 * a union type in input context to a synthetic input object (since GraphQL unions
 * are output-only). The emitter uses this to emit the `@oneOf` directive.
 *
 * @see https://spec.graphql.org/September2025/#sec-OneOf-Input-Objects
 */
extern dec oneOf(target: Model);
