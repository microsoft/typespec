import "../dist/src/lib/operation-kind.js";

using TypeSpec.Reflection;

namespace TypeSpec.GraphQL;

/**
 * Specify the GraphQL Operation kind for the target operation to be `MUTATION`.
 *
 * @example
 *
 * ```typespec
 * @mutation op update(): string
 * ```
 */
extern dec mutation(target: Operation);

/**
 * Specify the GraphQL Operation kind for the target operation to be `QUERY`.
 *
 * @example
 *
 * ```typespec
 * @query op read(): string
 * ```
 */
extern dec query(target: Operation);

/**
 * Specify the GraphQL Operation kind for the target operation to be `SUBSCRIPTION`.
 *
 * @example
 *
 * ```typespec
 * @subscription op get_periodically(): string
 * ```
 */
extern dec subscription(target: Operation);
