# Scalar Types

Scalar types in TypeSpec represent primitive values with additional semantics, constraints, or validation rules. They allow you to define custom types based on existing primitive types, making your API definitions more expressive and self-documenting.

## Scalar Type Declaration

Scalars are declared using the `scalar` keyword, followed by the name of the scalar and the base type it extends:

```typespec
scalar EmailAddress extends string;
```

This creates a new type `EmailAddress` that is based on `string` but can have its own semantics and constraints.

## Adding Constraints to Scalars

Scalars can be decorated with constraints to enforce validation rules:

```typespec
@pattern("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}")
scalar EmailAddress extends string;

@minLength(8)
@maxLength(64)
scalar Password extends string;

@minValue(0)
@maxValue(100)
scalar Percentage extends int32;
```

These constraints help document the expected format and range of values, and can be used by emitters to generate validation code.

## Format Decorators

The `@format` decorator can be used to specify a known format for a scalar:

```typespec
@format("uuid")
scalar UUID extends string;

@format("uri")
scalar URI extends string;

@format("date-time")
scalar Timestamp extends string;
```

The format provides a hint about the semantic meaning of the scalar, which can be used by emitters to generate appropriate client code or documentation.

## Scalar with Documentation

Use the `@doc` decorator to document the purpose and usage of a scalar:

```typespec
@doc("A universally unique identifier following the RFC-4122 standard")
@format("uuid")
scalar UUID extends string;

@doc("A fully qualified domain name")
@pattern("^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$")
scalar DomainName extends string;
```

## Scalar Type Hierarchy

Scalars can extend other scalars, creating a type hierarchy:

```typespec
scalar Identifier extends string;

@pattern("[A-Z][a-zA-Z0-9]{7,15}")
scalar ProductCode extends Identifier;

@pattern("[0-9]{9}")
scalar EmployeeID extends Identifier;
```

This allows you to create increasingly specialized types while maintaining a clear relationship to their base types.

## Common Scalar Type Patterns

Here are some common patterns for defining scalar types:

### Identifiers

```typespec
@format("uuid")
scalar UUID extends string;

@pattern("[a-zA-Z0-9-_]{4,32}")
scalar Username extends string;
```

### Formatted Strings

```typespec
@format("email")
scalar EmailAddress extends string;

@format("uri")
scalar URL extends string;

@pattern("^[A-Z0-9]{3}$")
scalar CurrencyCode extends string;
```

### Numeric Ranges

```typespec
@minValue(0)
scalar NonNegativeInteger extends int32;

@minValue(1)
scalar PositiveInteger extends int32;

@minValue(0)
@maxValue(100)
scalar Percentage extends int32;
```

### Date and Time

```typespec
@format("date")
scalar ISO8601Date extends string;

@format("time")
scalar ISO8601Time extends string;
```

## Using Scalar Types in Models

Scalar types can be used in models like any other type:

```typespec
model User {
  id: UUID;
  username: Username;
  email: EmailAddress;
  age: PositiveInteger;
  profile: {
    website?: URL;
    bio?: string;
  };
}
```

Using domain-specific scalar types makes your models more self-documenting and semantically rich.

## Scalar Type Values

TypeSpec scalars can define constructors for creating values of the scalar type:

```typespec
scalar ipV4 {
  init fromInt(value: int32);
}

const ip: ipV4 = ipV4.fromInt(3232235776);
```

This allows you to create scalar values with appropriate initialization for use in examples or constants.

## Scalar Types vs. Aliases

Scalar types are similar to type aliases but have important differences:

```typespec
// Type alias - simply a new name for an existing type
alias Email = string;

// Scalar type - a new type based on an existing type
scalar EmailAddress extends string;
```

Key differences:

- Scalar types create a new distinct type, while aliases are just alternative names for the same type
- Scalar types can have their own behaviors and constraints that are specific to that type
- Scalar types can be more easily identified and processed differently by emitters

## Best Practices

- **Use scalars for domain concepts**: Create scalar types for important domain concepts with specific constraints.
- **Name scalars clearly**: Choose names that clearly indicate the purpose or semantics of the type.
- **Document constraints**: Add decorators to document the expected format, range, or pattern of valid values.
- **Be consistent**: Use the same scalar types for the same concepts across your API.
- **Consider compatibility**: Ensure scalar types can be accurately represented in target formats and languages.
- **Use appropriate base types**: Choose the most appropriate primitive type as the base for your scalar.
- **Add documentation**: Use the `@doc` decorator to explain the purpose and usage of your scalar types.

By effectively using scalar types, you can create more expressive, self-documenting, and semantically rich API definitions that clearly communicate the expected data formats and constraints.
