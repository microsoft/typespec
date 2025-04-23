# Basic Types

TypeSpec provides a rich set of basic data types that form the foundation of your API definitions. Understanding these types is essential for creating accurate and well-structured models and operations.

## Primitive Types

TypeSpec includes several primitive data types that represent basic values:

### String Types

```typespec
model StringExample {
  // Basic string type - for text data
  basicString: string;

  // String with a specific format
  @format("email")
  email: string;

  // String with a pattern constraint
  @pattern("[a-zA-Z0-9]{4,10}")
  username: string;
}
```

### Numeric Types

TypeSpec provides several numeric types with different ranges and precisions:

```typespec
model NumericExample {
  // Integer types
  int8Value: int8; // 8-bit integer (-128 to 127)

  int16Value: int16; // 16-bit integer (-32,768 to 32,767)
  int32Value: int32; // 32-bit integer (-2^31 to 2^31-1)
  int64Value: int64; // 64-bit integer (-2^63 to 2^63-1)

  // Unsigned integer types
  uint8Value: uint8; // 8-bit unsigned integer (0 to 255)

  uint16Value: uint16; // 16-bit unsigned integer (0 to 65,535)
  uint32Value: uint32; // 32-bit unsigned integer (0 to 2^32-1)
  uint64Value: uint64; // 64-bit unsigned integer (0 to 2^64-1)

  // Floating-point types
  float32Value: float32; // 32-bit floating-point (single precision)

  float64Value: float64; // 64-bit floating-point (double precision)

  // Decimal types (for financial and other applications requiring exact decimal representation)
  decimalValue: decimal; // High-precision decimal number

  decimal128Value: decimal128; // 128-bit decimal number

  // Safe integer type (suitable for JavaScript clients)
  safeintValue: safeint; // Integer that can be safely represented in JSON (-2^53+1 to 2^53-1)
}
```

### Boolean Type

```typespec
model BooleanExample {
  isActive: boolean; // true or false
  isOptional?: boolean; // Optional boolean
}
```

### Bytes Type

For binary data:

```typespec
model BinaryExample {
  imageData: bytes; // Binary data (base64-encoded string in JSON)
  optionalData?: bytes; // Optional binary data
}
```

## Date and Time Types

TypeSpec includes several types for representing dates and times:

```typespec
model DateTimeExample {
  // Full date and time with timezone information
  createdAt: utcDateTime; // Date and time in UTC format (e.g., "2023-05-18T15:30:00Z")

  // Date only (no time component)
  birthDate: plainDate; // Calendar date without time (e.g., "2023-05-18")

  // Time only (no date component)
  openingTime: plainTime; // Clock time without date (e.g., "15:30:00")

  // Duration
  sessionTimeout: duration; // Time period or duration (e.g., "PT1H30M" for 1 hour and 30 minutes)
}
```

## Void Type

The `void` type is used when an operation returns no data:

```typespec
model Operations {
  op resetPassword(userId: string): void;  // Returns nothing
}
```

## The `never` Type

The `never` type represents a value that can never occur:

```typespec
model NeverExample {
  // This property can never have a value
  impossible: never;
}
```

This is mainly used in advanced type manipulations and template contexts.

## The `unknown` Type

The `unknown` type represents a value of any type:

```typespec
model DynamicExample {
  // Can be any type
  dynamicProperty: unknown;
}
```

This is generally used when the exact type cannot be determined in advance or for values that can be of any type.

## Type Aliases

You can create aliases for types using the `alias` keyword:

```typespec
// Create an alias for a primitive type
alias EmailAddress = string;

// Create an alias with constraints
@pattern("[a-zA-Z0-9]{4,10}")
alias Username = string;

// Use aliases in models
model User {
  email: EmailAddress;
  username: Username;
}
```

## Literal Types

TypeSpec supports literal types, which represent a specific value:

```typespec
model LiteralExample {
  // String literal
  status: "active" | "inactive" | "pending";

  // Numeric literal
  priority: 1 | 2 | 3 | 4 | 5;

  // Boolean literal (though usually just use a boolean type)
  isEnabled: true;
}
```

## Best Practices

- **Use the most specific type**: Choose the type that most accurately represents your data.
- **Consider interoperability**: Be aware of how types will be represented in target formats (e.g., JSON, XML).
- **Document constraints**: Use decorators like `@minValue`, `@maxValue`, `@minLength`, `@maxLength`, and `@pattern` to add constraints.
- **Consider language targets**: For client libraries, ensure the types can be accurately represented in target languages.
- **Prefer named types**: Use aliases for better semantics and documentation.
- **Be consistent**: Use the same types for similar concepts across your API.

By understanding and correctly using TypeSpec's basic types, you can create precise and consistent data models for your APIs.
