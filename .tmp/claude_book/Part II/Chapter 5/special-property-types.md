# Special Property Types

TypeSpec provides several special property types and patterns that can help you model more complex data structures. These special types enable you to represent discriminated unions, polymorphic models, and other advanced scenarios.

## Key Properties

You can mark a property as a key using the `@key` decorator. Key properties uniquely identify an instance of a model:

```typespec
model User {
  @key id: string;
  name: string;
  email: string;
}
```

Key properties are especially important when defining resource models:

```typespec
model Product {
  @key id: string;
  name: string;
  price: float64;
}

model OrderItem {
  quantity: int32;
  @key productId: string; // References Product.id
}
```

The `@key` decorator can also take an optional parameter to specify an alternate name:

```typespec
model Category {
  @key("categoryId") id: string;
  name: string;
}
```

## Secret Properties

For sensitive information, TypeSpec provides the `@secret` decorator:

```typespec
model UserCredentials {
  username: string;
  @secret password: string;
  @secret apiKey: string;
}
```

The `@secret` decorator indicates that a property contains sensitive information. Emitters can use this to apply special handling, such as masking values in logs or hiding them in documentation.

## Discriminators

Discriminators are special properties that help identify the specific type within a hierarchy of related models:

```typespec
@discriminator("kind")
model Pet {
  kind: string;
  name: string;
}

model Dog extends Pet {
  kind: "dog";
  breed: string;
}

model Cat extends Pet {
  kind: "cat";
  color: string;
}
```

In this example, the `kind` property acts as a discriminator, allowing consumers to determine whether an instance is a `Dog` or a `Cat`.

## Discriminated Unions

TypeSpec supports discriminated unions using the `@discriminated` decorator:

```typespec
@discriminated
union Animal {
  dog: Dog,
  cat: Cat,
  bird: Bird,
}

model Dog {
  breed: string;
  bark: boolean;
}

model Cat {
  color: string;
  meow: boolean;
}

model Bird {
  species: string;
  canFly: boolean;
}
```

By default, this generates a structure with `kind` and `value` properties:

```json
{
  "kind": "dog",
  "value": {
    "breed": "Labrador",
    "bark": true
  }
}
```

You can customize the property names:

```typespec
@discriminated({
  discriminatorPropertyName: "animalType",
  envelopePropertyName: "details",
})
union Animal {
  dog: Dog,
  cat: Cat,
  bird: Bird,
}
```

This would produce:

```json
{
  "animalType": "dog",
  "details": {
    "breed": "Labrador",
    "bark": true
  }
}
```

## Encoded Names

Sometimes the property name in the API needs to differ from the name used in TypeSpec. The `@encodedName` decorator handles this:

```typespec
model User {
  id: string;
  @encodedName("full-name") fullName: string;
  @encodedName("email-address") email: string;
}
```

This allows you to use TypeSpec-friendly camelCase names in your code while exposing kebab-case or other formats in your API.

## Format Specifications

The `@format` decorator specifies a data format for string properties:

```typespec
model User {
  id: string;
  name: string;
  @format("email") email: string;
  @format("uri") website: string;
  @format("date-time") lastLogin: string;
}
```

Common formats include:

- `email`
- `uri`
- `date-time`
- `date`
- `time`
- `uuid`
- `duration`
- `hostname`
- `ipv4`
- `ipv6`

## Pattern Properties

For string properties with specific formats, the `@pattern` decorator allows you to specify a regular expression pattern:

```typespec
model Product {
  @pattern("[A-Z]{2}[0-9]{6}")
  sku: string;

  @pattern("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}")
  supportEmail: string;
}
```

## Value Constraints

TypeSpec provides several decorators to constrain property values:

```typespec
model Constraints {
  // String length constraints
  @minLength(3)
  @maxLength(50)
  username: string;

  // Numeric value constraints
  @minValue(0)
  @maxValue(100)
  percentage: int32;

  // Array size constraints
  @minItems(1)
  @maxItems(10)
  tags: string[];
}
```

## Visibility Properties

The `@visibility` decorator controls when properties are visible:

```typespec
model User {
  @visibility(Lifecycle.Read)
  id: string; // Only visible when reading

  @visibility(Lifecycle.Create, Lifecycle.Update)
  password: string; // Only visible when creating or updating

  name: string; // Always visible
}
```

This is particularly useful for creating different views of the same model for different operations.

## Examples

You can provide example values for properties using the `@example` decorator:

```typespec
model User {
  id: string;

  @example("john.doe@example.com")
  email: string;

  @example("John Doe")
  name: string;
}
```

For entire models:

```typespec
@example({
  id: "123",
  email: "john.doe@example.com",
  name: "John Doe",
})
model User {
  id: string;
  email: string;
  name: string;
}
```

## Best Practices

1. **Use @key for resource identifiers**: Properties that uniquely identify resources should be marked with `@key`.

2. **Mark sensitive data with @secret**: Always mark passwords, tokens, and other sensitive information with `@secret`.

3. **Use discriminators for polymorphic models**: When a model can have multiple subtypes, use discriminators for clear type identification.

4. **Provide @format for string properties**: When strings have specific formats, use the `@format` decorator to make this explicit.

5. **Apply constraints appropriately**: Use constraint decorators to enforce validation rules directly in your API definition.

6. **Use @visibility to control property visibility**: Leverage visibility decorators to create appropriate views of your models for different operations.

7. **Include examples for complex properties**: Add examples to help API consumers understand expected values.

By utilizing these special property types effectively, you can create more expressive, precise, and user-friendly API definitions.
