# Union Types

Union types in TypeSpec represent values that can be one of several specified types. This powerful feature allows you to express situations where a property or parameter might have multiple possible types or variants.

## Basic Union Syntax

Union types are created using the pipe (`|`) operator between the possible types:

```typespec
model Response {
  // Result can be either a User or an Error
  result: User | Error;
}
```

In this example, the `result` property can be either a `User` or an `Error` model.

## Union with Multiple Types

Unions can include more than two types:

```typespec
model Property {
  name: string;

  // Value can be a string, number, or boolean
  value: string | int32 | boolean;
}
```

## Union with Literal Types

Unions can include literal types for creating enum-like structures:

```typespec
model Settings {
  // Theme can be only one of these three string values
  theme: "light" | "dark" | "system";

  // Priority can be only one of these numeric values
  priority: 1 | 2 | 3 | 4 | 5;
}
```

This is particularly useful for properties that can only have a few specific values.

## Named Union Declaration

You can define a named union type using the `union` keyword:

```typespec
union PaymentMethod {
  creditCard: CreditCard,
  bankTransfer: BankTransfer,
  paypal: PayPal,
}

model Payment {
  id: string;
  amount: decimal;
  method: PaymentMethod;
}
```

Named unions provide a way to reuse complex union types across your API definition.

## Discriminated Unions

For polymorphic scenarios where you need to distinguish between different variant types, you can use the `@discriminated` decorator:

```typespec
@discriminated
union Animal {
  dog: Dog,
  cat: Cat,
  bird: Bird,
}

model Dog {
  name: string;
  breed: string;
  bark: boolean;
}

model Cat {
  name: string;
  color: string;
  meow: boolean;
}

model Bird {
  name: string;
  species: string;
  canFly: boolean;
}
```

When using `@discriminated`, TypeSpec will generate a discriminator property (by default named "kind") that indicates which variant is present in the serialized form:

```json
{
  "kind": "dog",
  "value": {
    "name": "Rex",
    "breed": "German Shepherd",
    "bark": true
  }
}
```

## Customizing Discriminated Unions

You can customize the discriminator property name and envelope format:

```typespec
@discriminated({
  discriminatorPropertyName: "type",
  envelopePropertyName: "data",
})
union Vehicle {
  car: Car,
  motorcycle: Motorcycle,
  bicycle: Bicycle,
}
```

This will generate serialized forms like:

```json
{
  "type": "car",
  "data": {
    "make": "Toyota",
    "model": "Camry",
    "year": 2023
  }
}
```

## Union without Envelope

You can specify no envelope by setting `envelope: "none"`:

```typespec
@discriminated({
  discriminatorPropertyName: "type",
  envelope: "none",
})
union Shape {
  circle: Circle,
  square: Square,
  triangle: Triangle,
}

model Circle {
  type: "circle";
  radius: float32;
}

model Square {
  type: "square";
  sideLength: float32;
}

model Triangle {
  type: "triangle";
  base: float32;
  height: float32;
}
```

This will generate serialized forms like:

```json
{
  "type": "circle",
  "radius": 5.0
}
```

## Union Types in Operation Returns

Union types are particularly useful for operation return types, allowing you to specify multiple possible responses:

```typespec
op getUserById(id: string): User | NotFound | ServerError;
```

This clearly indicates that the operation can return either a `User` in the success case, or one of two possible error responses.

## Union Types vs. Enums

Union types with literal values can seem similar to enums, but they have different use cases:

```typespec
// Enum approach
enum Status {
  Active: "active",
  Inactive: "inactive",
  Pending: "pending",
}

model User1 {
  status: Status;
}

// Union approach
model User2 {
  status: "active" | "inactive" | "pending";
}
```

Use enums when:

- You want a named type that groups related values
- You need to reference the type elsewhere
- You want to document each value
- You might need to extend the set of values in the future

Use union with literals when:

- The set of values is small and unlikely to change
- The literal values are self-explanatory
- You don't need to reuse the type elsewhere

## Best Practices

### When to Use Union Types

- **For polymorphic models**: When a value could be one of several related but different types.
- **For success/error responses**: To clearly indicate that an operation can return either success or error responses.
- **For properties with limited values**: When a property can only have a few specific values.

### Naming and Documentation

- Use descriptive names for union variants that indicate the purpose or meaning.
- Document each variant with the `@doc` decorator.
- Consider using a naming convention for error types (e.g., `NotFoundError`, `ValidationError`).

### Union Design

- Keep the number of types in a union manageable (typically fewer than 5-7 types).
- Use discriminated unions for complex polymorphic scenarios.
- Consider how the union will be represented in target formats (JSON, XML, etc.) and client languages.

### Error Handling

- Use the `@error` decorator on error models that appear in unions to indicate they represent error conditions.
- Group related error types in a separate namespace or file.

By understanding and effectively using union types, you can create more expressive and flexible API definitions that accurately model the different possibilities in your domain.
