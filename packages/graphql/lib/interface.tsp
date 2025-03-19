import "../dist/src/lib/interface.js";

using TypeSpec.Reflection;

namespace TypeSpec.GraphQL;

/**
 * Mark this model as a GraphQL Interface. Interfaces can be implemented by other models.
 *
 * @example
 *
 * ```typespec
 * @Interface
 * model Person {
 *   name: string;
 * }
 */
extern dec Interface(target: Model);

/**
 * Specify the GraphQL interfaces that should be implemented by a model.
 * The interfaces must be decorated with the @Interface decorator,
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
extern dec compose(target: Model, ...implements: Model[]);
