import "../dist/src/lib/nullable.js";

using TypeSpec.Reflection;

namespace TypeSpec.GraphQL;

/**
 * Mark a field, operation, or type as nullable in the emitted GraphQL schema.
 *
 * Applied automatically by the mutation engine when it strips `| null` from
 * union types. The decorator's presence on the type's `decorators` array is
 * the signal — the implementation is a no-op.
 */
extern dec nullable(target: ModelProperty | Operation | Union | Model);

/**
 * Mark a field or operation as having nullable array elements in the emitted GraphQL schema.
 *
 * Applied automatically by the mutation engine when it detects `Array<T | null>`
 * patterns. Causes the emitter to emit `[T]` instead of `[T!]`.
 */
extern dec nullableElements(target: ModelProperty | Operation);
