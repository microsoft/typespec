# Expressing data criticality in TypeSpec

This proposal suggests a new decorator, `@critical`, that is used to indicate that the failure to produce a value for a property or operation will result in some larger failure of the operation.

<br>

## Goals

Be able to communicate to consumers of TypeSpec that a property or operation should be treated with different error handling semantics than the default.

<br>

## Definition

````typespec
/**
 * Specify that failure to produce a value for this property or operation will result in
 * some larger failure of the operation.
 *
 * @param error Optional error model that should be produced if the property or operation fails.
 *
 * @example
 *
 * ```typespec
 * model User {
 *   @critical email: string;
 * }
 * @critical op getUserEmail(user: User): string;
 * ```
 */
extern dec critical(target: ModelProperty | Operation, error?: Model);
````

## vs. requiredness

TypeSpec allows for specifying that a field is ["required" or "optional"][optional-properties] by the presence or absence of the `?` symbol.

In addition, there is a [`null` literal][null-literal] that be combined using a union to indicate that the value of a property can be `null`.

`@critical` does not specify anything about a property's requiredness, nor whether it may be nullable. A property that can have the value `null` can still be a critical property, and an optional property may still be critical.

# Use cases

## GraphQL

In GraphQL, [all fields are nullable by default][graphql-non-null].
When there is an error in [resolving a field][graphql-resolving-field], a GraphQL implementation [will return a `null` value for that field][graphql-handling-field-errors].

A field can also be [marked as Non-Null][graphql-non-null]. When there is an error in resolving such a field, a GraphQL implementation [will propagate the error][graphql-handling-field-errors] to the parent field.

## Client libraries

When generating client code with TypeSpec, the `@critical` decorator offers client libraries a means to apply language-specific concepts to the critical property.

## Server libraries

When generating server code with TypeSpec, the `@critical` decorator offers a way to generate server code that properly fulfills the TypeSpec-defined contract by throwing an error when a critical property is not fulfilled.

In an HTTP server, for example, this could be done by throwing an HTTP error with a 5xx status code.

## Examples

### Avoiding dangerous behavior

Consider an application that serves content that should not be viewable by certain users. The application needs to:

- check if the user is allowed to view the content
- prompt the user for verification if their status is unknown
- avoid showing the content to the user unless they are known to be verified

We might create a property on a `User` model like this:

```typescript
model User {
  @key id: string;
  email: string;
  fullName?: string;
  @critical canViewRestrictedContent: boolean | null;
}
```

Without `@critical`, a server implementation might by default return `null` for the `canViewRestrictedContent` property if an error occurs. This would trigger unwanted behavior, as the client would likely respond by prompting the user for verification even though we were unable to determine if the user needs verification.

With `@critical`, the server can instead raise an error if it is unable to determine if the user can view restricted content. This would allow the client to handle the error in a way that does not prompt the user for verification, but property suggests that an error occurred and they should try again later.

[graphql-non-null]: https://spec.graphql.org/October2021/#sec-Non-Null
[graphql-resolving-field]: https://spec.graphql.org/October2021/#sec-Value-Completion
[graphpql-handling-field-errors]: https://spec.graphql.org/October2021/#sec-Handling-Field-Errors
[optional-properties]: https://typespec.io/docs/language-basics/models/#optional-properties
[null-literal]: https://typespec.io/docs/language-basics/values/#null-values
[java-nonnull]: https://checkerframework.org/jsr308/specification/java-annotation-design.html#type-qualifiers
[java-requirenonnull]: https://docs.oracle.com/javase/8/docs/api/java/util/Objects.html#requireNonNull-T-
