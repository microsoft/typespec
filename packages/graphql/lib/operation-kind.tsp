using TypeSpec.Reflection;

namespace TypeSpec.GraphQL;

/**
 * Specify the GraphQL Operation kind for the target operation to be `MUTATION`.
 *
 * @example
 *
 * ```typespec
 * @mutation op createUser(name: string): User;
 * ```
 */
extern dec mutation(target: Operation);

/**
 * Specify the GraphQL Operation kind for the target operation to be `QUERY`.
 *
 * @example
 *
 * ```typespec
 * @query op getUser(id: string): User;
 * ```
 */
extern dec query(target: Operation);

/**
 * Specify the GraphQL Operation kind for the target operation to be `SUBSCRIPTION`.
 *
 * @example
 *
 * ```typespec
 * @subscription op onUserCreated(): User;
 * ```
 */
extern dec subscription(target: Operation);
