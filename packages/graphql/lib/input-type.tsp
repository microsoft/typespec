using TypeSpec.Reflection;

namespace TypeSpec.GraphQL;

/**
 * Mark a model as a GraphQL input type in the emitted schema.
 *
 * This decorator is applied automatically by the mutation engine when it produces
 * a model that is used in input position. The emitter uses this to emit the model
 * as an `input` type rather than an object `type`.
 */
internal auto dec inputType(target: Model);
