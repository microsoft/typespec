import "../dist/src/lib/interface.js";

using TypeSpec.Reflection;

namespace TypeSpec.GraphQL;

/**
 * Mark this model as a GraphQL Interface. Interfaces can be implemented by other models.
 *
 * @param interfaceOnly When true, the model will only be emitted as an interface (no
 * "Interface" suffix is added to the name). Use this for models that will never be
 * used directly as output/input types (e.g., Node, Connection). Defaults to false.
 *
 * @example
 *
 * ```typespec
 * @`interface`(#{interfaceOnly: true})
 * model Node {
 *   id: string;
 * }
 *
 * @`interface`
 * model Person {
 *   name: string;
 * }
 * ```
 */
extern dec `interface`(target: Model, options?: valueof {interfaceOnly?: boolean});

/**
 * Specify the GraphQL interfaces that should be implemented by a model.
 * The interfaces must be decorated with the @`interface` decorator,
 * and all of the interfaces' properties must be present and compatible.
 *
 * @example
 *
 * ```typespec
 * @compose(Influencer, Person)
 * model User {
 *  ... Influencer;
 *  ... Person;
 * }
 */
extern dec compose(target: Model, ...interfaces: Model[]);
