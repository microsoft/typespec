# 11. Unions and Intersections

TypeSpec provides powerful type composition capabilities through unions and intersections. These features allow you to combine types in different ways to express complex type relationships. This section explores how to use unions and intersections in TypeSpec.

## Understanding Type Composition

TypeSpec offers two primary mechanisms for composing types:

1. **Unions**: Represent values that could be one of several types (OR relationship)
2. **Intersections**: Combine multiple types into one type that has all properties of its constituents (AND relationship)

## Union Types

A union type represents a value that can be one of several types. It's defined using the pipe symbol (`|`).

### Basic Union Syntax

```typespec
alias StringOrNumber is string | int32;
```

This creates a type that can be either a string or a 32-bit integer.

### Union Types in Models

Unions can be used as property types within models:

```typespec
model Result {
  value: string | int32 | boolean;
}
```

### Union with Null

A common pattern is to create optional types using unions with `null`:

```typespec
model OptionalData {
  value: string | null;
}
```

### Union of Models

You can create unions of model types:

```typespec
model User {
  id: string;
  email: string;
}

model Guest {
  sessionId: string;
}

alias Identity is User | Guest;
```

### Union of Enums

As we saw in the previous section, unions can combine enums:

```typespec
enum StatusSuccess {
  OK: 200,
  Created: 201,
}

enum StatusError {
  BadRequest: 400,
  NotFound: 404,
}

alias Status is StatusSuccess | StatusError;
```

### Union of Literal Types

Unions can include literal types for more precise type definitions:

```typespec
alias Direction is "north" | "south" | "east" | "west";
```

This is similar to an enum but defined directly as a union of string literals.

### Discriminated Unions

Discriminated unions are a pattern where a property (the discriminator) determines which type in the union is being used:

```typespec
model Animal {
  kind: string;
}

model Dog extends Animal {
  kind: "dog";
  bark: boolean;
}

model Cat extends Animal {
  kind: "cat";
  meow: boolean;
}

alias Pet is Dog | Cat;
```

In this example, the `kind` property serves as the discriminator.

## Intersection Types

An intersection type combines multiple types into one, creating a new type that has all the properties of its constituent types. It's defined using the ampersand symbol (`&`).

### Basic Intersection Syntax

```typespec
alias CombinedType is Type1 & Type2;
```

### Combining Models with Intersections

```typespec
model Timestamped {
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model Identifiable {
  id: string;
}

alias TimestampedResource is Timestamped & Identifiable;
```

The `TimestampedResource` type has all properties from both `Timestamped` and `Identifiable`.

### Using Intersection Types in Models

```typespec
model User {
  ...Identifiable & Timestamped;
  name: string;
  email: string;
}
```

This is equivalent to:

```typespec
model User {
  id: string;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
  name: string;
  email: string;
}
```

### Intersection with Record Types

You can combine model types with record types:

```typespec
model BaseUser {
  id: string;
  name: string;
}

alias UserWithMetadata is BaseUser & Record<string, unknown>;
```

### Conditional Intersections

You can create conditional intersections using template types:

```typespec
model Entity<T> {
  ...T extends { id: string } ? {} : { id: string };
  ...T;
}
```

## Complex Type Compositions

Unions and intersections can be combined to create complex type relationships.

### Union of Intersections

```typespec
alias ComplexType is (TypeA & TypeB) | (TypeC & TypeD);
```

### Intersection of Unions

```typespec
alias AnotherComplexType is (TypeA | TypeB) & (TypeC | TypeD);
```

### Combining with Templates

```typespec
model Result<T, E> {
  data: T | null;
  error: E | null;
  isSuccess: boolean;
}

alias ApiResult<T> is Result<T, ApiError>;
```

## Common Use Cases

### Optional Properties with Unions

```typespec
model UserUpdate {
  name: string | null;
  email: string | null;
}
```

### API Response Patterns

```typespec
model SuccessResponse<T> {
  data: T;
  statusCode: 200 | 201;
}

model ErrorResponse {
  error: string;
  statusCode: 400 | 404 | 500;
}

alias ApiResponse<T> is SuccessResponse<T> | ErrorResponse;
```

### Feature Flags with Intersections

```typespec
model BaseProduct {
  id: string;
  name: string;
  price: decimal;
}

model InventoryFeature {
  stockLevel: int32;
  isInStock: boolean;
}

model RatingFeature {
  averageRating: float32;
  reviewCount: int32;
}

alias BasicProduct is BaseProduct;
alias InventoryProduct is BaseProduct & InventoryFeature;
alias FullProduct is BaseProduct & InventoryFeature & RatingFeature;
```

## Best Practices for Unions and Intersections

When using unions and intersections in TypeSpec, follow these best practices:

1. **Use descriptive aliases**: Create named aliases for complex unions and intersections to improve readability.

2. **Prefer discriminated unions**: When using unions of models, include a discriminator property to make it clear which type is being used.

3. **Keep intersections focused**: Combine related types with intersections rather than creating monolithic types.

4. **Document composed types**: Add JSDoc comments to explain the purpose and usage of union and intersection types.

5. **Consider serialization**: Be aware of how union and intersection types will be represented in your generated output formats.

6. **Use with templates**: Combine unions and intersections with templates for powerful, reusable type patterns.

7. **Avoid deep nesting**: Excessive nesting of unions and intersections can make types difficult to understand.

## Common Pitfalls

### Incompatible Intersections

Be careful when intersecting types with conflicting properties:

```typespec
model A {
  prop: string;
}

model B {
  prop: int32;
}

// This may lead to unexpected results or errors
alias AB is A & B;
```

### Union Type Narrowing

In some contexts, TypeSpec might not be able to narrow union types as precisely as you might expect:

```typespec
model Result<T> {
  data: T | null;

  // TypeSpec might not be able to infer that data is non-null here
  isSuccess: boolean = data != null;
}
```

## Unions and Intersections in Output Formats

Different emitters handle unions and intersections in various ways:

### OpenAPI Output

In OpenAPI, unions typically become `oneOf` schemas:

```yaml
components:
  schemas:
    Pet:
      oneOf:
        - $ref: "#/components/schemas/Dog"
        - $ref: "#/components/schemas/Cat"
      discriminator:
        propertyName: kind
        mapping:
          dog: "#/components/schemas/Dog"
          cat: "#/components/schemas/Cat"
```

Intersections might be flattened into a single schema with all properties.

### JSON Schema Output

In JSON Schema, unions become `oneOf` or `anyOf` schemas, and intersections become `allOf` schemas:

```json
{
  "Pet": {
    "oneOf": [{ "$ref": "#/definitions/Dog" }, { "$ref": "#/definitions/Cat" }]
  },
  "TimestampedResource": {
    "allOf": [{ "$ref": "#/definitions/Timestamped" }, { "$ref": "#/definitions/Identifiable" }]
  }
}
```

## Summary

Unions and intersections in TypeSpec provide powerful mechanisms for type composition. Unions allow you to represent values that could be one of several types, while intersections let you combine multiple types into one that has all their properties. By using these features effectively, you can create expressive, flexible, and precise API definitions.

In the next section, we'll explore type literals and aliases in TypeSpec, which provide additional ways to define and reference types.
