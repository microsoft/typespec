using TypeSpec.Reflection;

namespace TypeSpec.GraphQL;

alias OperationOrInterface = Operation | Interface;

/**
 * Assign one or more operations or interfaces to act as fields with arguments on a model.
 * The operations become fields on the GraphQL type with their parameters as arguments.
 *
 * @example
 *
 * ```typespec
 * op followers(query: string): Person[];
 *
 * @operationFields(followers)
 * model Person {
 *   name: string;
 * }
 * // Emits: type Person { name: String!; followers(query: String!): [Person!]! }
 * ```
 */
extern dec operationFields(target: Model, ...operations: OperationOrInterface[]);
