using TypeSpec.Reflection;

namespace TypeSpec.GraphQL;

/**
 * Provide a specification URL for a custom GraphQL scalar type.
 * This maps to the `@specifiedBy` directive in the emitted GraphQL schema.
 *
 * @param url URL to the scalar type specification
 * @example
 *
 * ```typespec
 * @specifiedBy("https://scalars.graphql.org/jakobmerrild/long.html")
 * scalar Long extends int64;
 * ```
 */
extern dec specifiedBy(target: Scalar, url: valueof url);
