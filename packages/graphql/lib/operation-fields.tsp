import "../dist/src/lib/operation-fields.js";

using TypeSpec.Reflection;

namespace TypeSpec.GraphQL;

alias OperationOrInterface = Operation | Interface;

/**
 * Assign one or more operations or interfaces to act as fields with arguments on a model.
 *
 * @example
 *
 * ```typespec
 * op followers(query: string): Person[];
 *
 * @operationFields(followers)
 * model Person {}
 */
extern dec operationFields(target: Model, ...operations: OperationOrInterface[]);
