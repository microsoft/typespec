using TypeSpec.Reflection;

namespace TypeSpec.GraphQL;

/**
 * Mark this model as a GraphQL Interface. Interfaces can be implemented by other models
 * using the `@compose` decorator.
 *
 * @param options.interfaceOnly When true, the model will only be emitted as an interface
 * (no "Interface" suffix is added to the name). Use this for abstract interfaces that
 * will never be used directly as output/input types (e.g., Node, Connection). Defaults to false.
 *
 * @example
 *
 * ```typespec
 * @graphqlInterface(#{ interfaceOnly: true })
 * model Node {
 *   id: string;
 * }
 *
 * @compose(Node)
 * model User {
 *   ...Node;
 *   name: string;
 * }
 * // Emits: interface Node { id: String! }
 * //        type User implements Node { id: String!; name: String! }
 * ```
 */
extern dec graphqlInterface(
  target: Model,
  options?: valueof {
    interfaceOnly?: boolean,
  }
);

/**
 * Specify the GraphQL interfaces that should be implemented by a model.
 * The interfaces must be decorated with the `@graphqlInterface` decorator,
 * and all of the interfaces' properties must be present and compatible.
 *
 * @example
 *
 * ```typespec
 * @graphqlInterface(#{ interfaceOnly: true })
 * model Node {
 *   id: string;
 * }
 *
 * @compose(Node)
 * model User {
 *   ...Node;
 *   name: string;
 * }
 * ```
 */
extern dec compose(target: Model, ...interfaces: Model[]);
