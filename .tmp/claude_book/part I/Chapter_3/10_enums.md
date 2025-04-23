# 10. Enums

Enums (enumerations) in TypeSpec allow you to define a set of named constant values. They are useful for representing a fixed set of options or states in your API definitions. This section explores how to declare and use enums in TypeSpec.

## Understanding Enums

An enum in TypeSpec is a distinct type that consists of a set of named constant values. Enums are particularly useful for representing concepts like status codes, categories, types, or any other fixed set of values.

## Declaring Basic Enums

The basic syntax for declaring an enum is:

```typespec
enum StatusCode {
  OK,
  Created,
  BadRequest,
  NotFound,
  InternalServerError,
}
```

By default, enum members are represented as strings with values equal to their names.

## Enum Member Values

You can explicitly assign values to enum members:

### String Values

```typespec
enum Status {
  Active: "active",
  Inactive: "inactive",
  Pending: "pending",
}
```

### Numeric Values

```typespec
enum Priority {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
}
```

### Mixed Values

TypeSpec also allows mixing types within an enum, though this is generally not recommended for clarity:

```typespec
enum MixedEnum {
  String: "string",
  Number: 42,
  Boolean: true,
}
```

## Enum Documentation

Add documentation to enums using JSDoc-style comments:

```typespec
/**
 * The status of a user account.
 */
enum AccountStatus {
  /**
   * The account is active and can be used.
   */
  Active: "active",

  /**
   * The account has been temporarily suspended.
   */
  Suspended: "suspended",

  /**
   * The account has been permanently disabled.
   */
  Disabled: "disabled",
}
```

## Using Enums in Models

Enums can be used as property types in models:

```typespec
model User {
  id: string;
  name: string;
  status: AccountStatus;
}
```

## Enum Extensibility

### Extending Enums

You can extend existing enums to add new members:

```typespec
enum HttpSuccessCode {
  OK: 200,
  Created: 201,
  Accepted: 202,
}

enum ExtendedHttpSuccessCode extends HttpSuccessCode {
  NonAuthoritativeInformation: 203,
  NoContent: 204,
}
```

### Union of Enums

You can combine multiple enums using union types:

```typespec
enum HttpSuccessCode {
  OK: 200,
  Created: 201,
  Accepted: 202,
}

enum HttpErrorCode {
  BadRequest: 400,
  Unauthorized: 401,
  Forbidden: 403,
}

alias HttpCode is HttpSuccessCode | HttpErrorCode;
```

## Extending Enums with Decorators

Decorators can be applied to enums and enum members to provide additional metadata or behavior:

```typespec
@doc("HTTP status codes")
enum HttpStatusCode {
  @doc("The request has succeeded")
  OK: 200,

  @doc("The request has succeeded and a new resource has been created")
  Created: 201,
}
```

## Enum Visibility

Control the visibility of enums using the `@visibility` decorator:

```typespec
@visibility("internal")
enum InternalStatus {
  Pending,
  Processing,
  Complete,
}
```

## Referencing Enum Members

You can reference individual enum members using the enum name followed by a dot and the member name:

```typespec
model ApiResponse<T> {
  data: T;
  statusCode: HttpStatusCode;

  // Reference specific enum members
  isSuccess: boolean = statusCode == HttpStatusCode.OK;
}
```

## Enum Best Practices

When defining enums in TypeSpec, follow these best practices:

1. **Use PascalCase for enum names**: Enums should be named using PascalCase (e.g., `StatusCode`).

2. **Use PascalCase for enum members**: Enum members should also use PascalCase (e.g., `NotFound`).

3. **Be consistent with value types**: Try to use the same type for all values within an enum.

4. **Provide explicit values**: Explicitly define values for enum members to control their serialization.

5. **Document enums thoroughly**: Add JSDoc comments to describe the purpose of the enum and its members.

6. **Group related enums**: Keep related enums together and consider using namespaces to organize them.

7. **Consider extensibility**: Design enums with future extensions in mind, especially for versioned APIs.

## Common Enum Patterns

### Status Enums

```typespec
enum Status {
  Active: "active",
  Inactive: "inactive",
  Deleted: "deleted",
}
```

### Type Discriminators

```typespec
enum EntityType {
  User: "user",
  Product: "product",
  Order: "order",
}

model Entity {
  id: string;
  type: EntityType;
}

model User extends Entity {
  type: EntityType.User;
  email: string;
}

model Product extends Entity {
  type: EntityType.Product;
  price: decimal;
}
```

### Flag Enums

Although TypeSpec doesn't have built-in support for flag enums (bitwise enumerations), you can simulate them with numeric values:

```typespec
enum Permissions {
  None: 0,
  Read: 1,
  Write: 2,
  Delete: 4,
  All: 7, // Read | Write | Delete
}
```

## Enums vs. String Unions

TypeSpec allows you to define a union of string literals, which is similar to enums:

```typespec
// Using an enum
enum Status {
  Active: "active",
  Inactive: "inactive",
}

// Using a string union type
alias StatusUnion is "active" | "inactive";
```

When choosing between enums and string unions:

- Use **enums** when you need named constants or when the set of values might be extended in the future.
- Use **string unions** for simpler cases when you just need to restrict a string to a set of possible values.

## Enums in Generated Output

Different emitters handle enums in various ways:

### OpenAPI Output

In OpenAPI output, TypeSpec enums typically become enum constraints on properties:

```yaml
components:
  schemas:
    Status:
      type: string
      enum:
        - active
        - inactive
        - pending
```

### JSON Schema Output

In JSON Schema output, enums become similar enum constraints:

```json
{
  "Status": {
    "type": "string",
    "enum": ["active", "inactive", "pending"]
  }
}
```

## Summary

Enums in TypeSpec provide a way to define a fixed set of named values, making your API definitions more expressive and type-safe. By using enums effectively, you can create more readable, maintainable, and self-documenting API definitions.

In the next section, we'll explore unions and intersections in TypeSpec, which allow you to combine types in powerful ways.
