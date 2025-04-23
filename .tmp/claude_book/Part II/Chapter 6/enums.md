# Enums

Enumerations (enums) in TypeSpec represent a type that can have only a predefined set of values. They are useful for properties that have a fixed set of named values, such as status codes, categories, or states.

## Basic Enum Declaration

Enums are declared using the `enum` keyword, followed by the enum name and a block containing the possible values:

```typespec
enum Status {
  Active,
  Inactive,
  Pending,
}
```

You can then use this enum as a type in models:

```typespec
model User {
  id: string;
  name: string;
  status: Status; // Can only be Active, Inactive, or Pending
}
```

## Enum with String Values

By default, enum members don't have explicit values associated with them. However, you can assign string values to enum members:

```typespec
enum PaymentMethod {
  CreditCard: "credit_card",
  BankTransfer: "bank_transfer",
  PayPal: "paypal",
  ApplePay: "apple_pay",
}
```

This is useful when you need the enum values to match specific string representations in your API.

## Enum with Numeric Values

Enum members can also have numeric values:

```typespec
enum ErrorCode {
  Success: 0,
  NotFound: 404,
  Unauthorized: 401,
  BadRequest: 400,
  ServerError: 500,
}
```

## Mixed Value Types

While it's generally recommended to use consistent value types within an enum, TypeSpec allows mixed value types if necessary:

```typespec
enum MixedEnum {
  String: "string_value",
  Number: 42,
  Boolean: true
}
```

However, this approach should be used sparingly, as it can make the API less predictable and harder to consume.

## Documentation for Enums

Like other types, enums and their members can be documented with the `@doc` decorator:

```typespec
@doc("Status of the user account")
enum UserStatus {
  @doc("User is active and can use the system")
  Active,

  @doc("User account has been deactivated")
  Inactive,

  @doc("User account is awaiting verification")
  Pending,
}
```

## Enum Extensibility

Unlike some programming languages, TypeSpec doesn't have a direct mechanism for extending enums. If you need to add values to an existing enum, you would typically create a new version of the enum with additional values.

## Using Enums with Union Types

Enums can be combined with union types to create more flexible type definitions:

```typespec
enum StandardSize {
  Small,
  Medium,
  Large,
}

model Product {
  id: string;
  name: string;

  // Size can be a standard size or a custom numeric value
  size: StandardSize | int32;
}
```

## Enum Best Practices

### Naming Conventions

- Use PascalCase for enum names
- Use PascalCase for enum members
- Use singular nouns for enum names that represent categories or types
- Use descriptive names that clearly indicate the purpose of the enum

### Value Assignment

- Be consistent with value types within a single enum
- Consider using string values for better readability in serialized formats
- Choose values that align with the actual values used in your API implementation

### Documentation

- Document the purpose of each enum
- Document the meaning of each enum member, especially if it's not obvious from the name
- Include any relevant business rules or constraints related to the enum values

### Usage Guidelines

- Use enums for properties with a fixed set of possible values
- Avoid using enums for open-ended sets that might grow unpredictably
- Consider using string literals (`"value1" | "value2"`) for simple cases where a full enum isn't necessary

## Examples of Common Enum Patterns

### Status Enums

```typespec
enum OrderStatus {
  Pending,
  Processing,
  Shipped,
  Delivered,
  Cancelled,
}

enum ResourceStatus {
  Active,
  Inactive,
  Deleted,
}
```

### Type Enums

```typespec
enum PaymentType {
  OneTime,
  Recurring,
  Installment,
}

enum ContentType {
  Article,
  Video,
  Image,
  Audio,
}
```

### Category Enums

```typespec
enum ProductCategory {
  Electronics,
  Clothing,
  Books,
  HomeAndGarden,
  Automotive,
}

enum Priority {
  Low,
  Medium,
  High,
  Critical,
}
```

### Role Enums

```typespec
enum UserRole {
  Admin,
  Editor,
  Author,
  Viewer,
}
```

By using enums effectively, you can create more expressive, self-documenting API definitions that clearly communicate the valid values for properties with a fixed set of options.
