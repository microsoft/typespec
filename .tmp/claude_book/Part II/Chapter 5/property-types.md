# Property Types

Properties in TypeSpec models can have various types that define the kind of data they can contain. Understanding the available types and when to use them is essential for creating accurate API definitions.

## Built-in Scalar Types

TypeSpec provides a number of built-in scalar types for common data formats:

### String Types

```typespec
model StringTypes {
  basic: string; // Any text
  url: url; // URL format
  uuid: uuid; // UUID format
  password: password; // Password string (may be hidden in documentation)
}
```

### Numeric Types

```typespec
model NumericTypes {
  // Integer types
  int8Value: int8; // 8-bit integer (-128 to 127)

  int16Value: int16; // 16-bit integer (-32,768 to 32,767)
  int32Value: int32; // 32-bit integer (-2,147,483,648 to 2,147,483,647)
  int64Value: int64; // 64-bit integer (-9,223,372,036,854,775,808 to 9,223,372,036,854,775,807)

  // Unsigned integer types
  uint8Value: uint8; // 8-bit unsigned integer (0 to 255)

  uint16Value: uint16; // 16-bit unsigned integer (0 to 65,535)
  uint32Value: uint32; // 32-bit unsigned integer (0 to 4,294,967,295)
  uint64Value: uint64; // 64-bit unsigned integer (0 to 18,446,744,073,709,551,615)

  // Floating point types
  float32Value: float32; // 32-bit floating point

  float64Value: float64; // 64-bit floating point

  // Other numeric types
  decimalValue: decimal; // Arbitrary precision decimal

  safeintValue: safeint; // Integer that can be safely represented in JSON
}
```

### Boolean Type

```typespec
model BooleanType {
  isEnabled: boolean; // true or false
}
```

### Date and Time Types

```typespec
model DateTimeTypes {
  dateValue: plainDate; // Date without time (e.g., "2023-04-15")
  timeValue: plainTime; // Time without date (e.g., "14:30:00")
  dateTimeValue: utcDateTime; // Date and time in UTC (e.g., "2023-04-15T14:30:00Z")
  durationValue: duration; // Duration (e.g., "PT1H30M" for 1 hour and 30 minutes)
}
```

### Binary Data

```typespec
model BinaryType {
  fileData: bytes; // Binary data (can be used for files, images, etc.)
}
```

## Array Types

Arrays represent collections of items of the same type:

```typespec
model ArrayTypes {
  stringArray: string[]; // Array of strings
  numberArray: int32[]; // Array of integers
  complexArray: User[]; // Array of User models

  // Multidimensional arrays
  matrix: int32[][]; // 2D array (array of arrays)
}
```

## Model Types

Properties can be of other model types, creating relationships between models:

```typespec
model Address {
  street: string;
  city: string;
  zipCode: string;
}

model User {
  id: string;
  name: string;
  homeAddress: Address; // Property of model type
  workAddress: Address; // Another property of the same model type
}
```

## Union Types

Union types allow a property to be one of several types:

```typespec
model UnionTypes {
  // Simple union of scalar types
  idField: string | int32;

  // Union of model types
  item: Product | Service;

  // Union with literal values
  status: "active" | "inactive" | "pending";
}
```

## Enum Types

Properties can use enum types to restrict values to a predefined set:

```typespec
enum Color {
  Red,
  Green,
  Blue,
}

model EnumTypes {
  primaryColor: Color;
}
```

## Record Type

The `Record<T>` type represents an object with string keys and values of type T:

```typespec
model DynamicProperties {
  metadata: Record<string>; // Object with string values
  counts: Record<int32>; // Object with integer values
  settings: Record<boolean>; // Object with boolean values

  // Record with complex value types
  userPreferences: Record<UserPreference>;
}
```

## Template Types

Properties can use template types that are parameterized:

```typespec
model Paginated<T> {
  items: T[];
  totalCount: int32;
  pageSize: int32;
  pageNumber: int32;
}

model API {
  users: Paginated<User>;
  products: Paginated<Product>;
}
```

## Anonymous Object Types

Properties can have inline anonymous object types:

```typespec
model InlineTypes {
  address: {
    street: string;
    city: string;
    zipCode: string;
  };
  metadata: {
    createdAt: utcDateTime;
    createdBy: string;
  };
}
```

## Type Literals

Properties can have literal types that restrict them to specific values:

```typespec
model LiteralTypes {
  httpSuccess: 200 | 201 | 204; // Numeric literals
  direction: "north" | "south" | "east" | "west"; // String literals
  flag: true; // Boolean literal
}
```

## Property Type Constraints

You can apply additional constraints to property types using decorators:

```typespec
model Constraints {
  @minLength(3)
  @maxLength(50)
  username: string;

  @minValue(0)
  @maxValue(100)
  percentage: int32;

  @pattern("[A-Z]{2}[0-9]{9}")
  trackingNumber: string;

  @minItems(1)
  @maxItems(10)
  tags: string[];
}
```

## Best Practices

When choosing property types, consider these best practices:

- **Be specific**: Use the most specific type that captures your requirements
- **Use appropriate ranges**: For numeric types, choose ones that can accommodate your valid range
- **Consider format and validation**: Use decorators to enforce additional constraints
- **Document special formats**: When using string with special formats, document the expected format
- **Think about compatibility**: Consider how types will be represented in target languages or protocols
- **Balance flexibility and constraints**: Choose types that provide enough validation without being overly restrictive

By carefully selecting the appropriate property types, you can create more precise and self-documenting API definitions.
