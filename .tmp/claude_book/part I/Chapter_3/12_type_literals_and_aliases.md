# 12. Type Literals and Aliases

TypeSpec provides ways to work with literal values as types and to create aliases for types. These features enhance the expressiveness and readability of your API definitions. This section explores how to use type literals and aliases in TypeSpec.

## Type Literals

Type literals are exact values that can be used as types. TypeSpec supports several kinds of type literals.

### String Literals

String literals represent specific string values:

```typespec
// A type that can only be the string "active"
alias ActiveStatus is "active";
```

### Numeric Literals

Numeric literals represent specific numeric values:

```typespec
// A type that can only be the number 200
alias OkStatusCode is 200;
```

### Boolean Literals

Boolean literals represent either `true` or `false`:

```typespec
// A type that can only be true
alias EnabledFlag is true;
```

### Array Literals

Array literals represent specific arrays with a fixed set of elements:

```typespec
// A type that represents the array [1, 2, 3]
alias FirstThreeNumbers is [1, 2, 3];
```

### Object Literals

Object literals represent specific objects with a fixed set of properties:

```typespec
// A type that represents a specific point
alias Origin is {
  x: 0,
  y: 0,
};
```

## Type Aliases

Type aliases create named references to types, making your code more readable and maintainable.

### Basic Alias Syntax

The basic syntax for declaring a type alias is:

```typespec
alias AliasName is Type;
```

### Aliasing Simple Types

You can create aliases for simple types:

```typespec
alias ID is string;
alias Count is int32;
alias Enabled is boolean;
```

### Aliasing Union Types

Aliases are particularly useful for union types:

```typespec
alias Status is "pending" | "active" | "inactive";
alias StatusCode is 200 | 400 | 404 | 500;
```

### Aliasing Intersection Types

You can alias intersection types for reuse:

```typespec
alias ResourceMetadata is Timestamps & AuditInfo;
```

### Aliasing Model Types

You can create aliases for models:

```typespec
model User {
  id: string;
  name: string;
  email: string;
}

alias Employee is User;
```

### Aliasing Template Instantiations

Aliases can reference template instantiations:

```typespec
model Container<T> {
  value: T;
}

alias StringContainer is Container<string>;
alias NumberContainer is Container<int32>;
```

### Aliasing Operations

You can create aliases for operations:

```typespec
operation get<T>(id: string): T;

alias getUser is get<User>;
alias getProduct is get<Product>;
```

## Using Type Aliases and Literals

Type aliases and literals can be used in various contexts within TypeSpec.

### In Property Types

```typespec
model User {
  id: ID; // Using an alias
  status: "active" | "inactive"; // Using literal types directly
}
```

### In Operation Parameters and Return Types

```typespec
operation updateStatus(
  id: ID,  // Using an alias
  status: Status  // Using an alias for a union of string literals
): {
  success: true  // Using a boolean literal
};
```

### In Template Arguments

```typespec
model Result<T, E> {
  data: T | null;
  error: E | null;
}

alias SuccessResult is Result<User, never>;
```

### In Constraints

```typespec
model Entity<T extends {id: string}> {
  ...T;
}
```

## Advanced Alias Patterns

### Recursive Aliases

Aliases can reference themselves for recursive types:

```typespec
model TreeNode<T> {
  value: T;
  children: TreeNode<T>[] | null;
}

alias NumberTree is TreeNode<int32>;
```

### Conditional Types with Aliases

You can create conditional types using aliases:

```typespec
alias NonNullable<T> is T extends null ? never : T;
```

### Type Distributivity

Aliases can distribute over union types:

```typespec
model Container<T> {
  value: T;
}

alias MultiContainer is Container<string | int32 | boolean>;
// Equivalent to: Container<string> | Container<int32> | Container<boolean>
```

## Using Type Literals for Constraints

Type literals are useful for creating constrained types:

### String Patterns

```typespec
@pattern("^[A-Z]{2}[0-9]{2}$")
alias CountryCode is string;
```

### Numeric Ranges

```typespec
@minValue(1)
@maxValue(100)
alias Percentage is int32;
```

### String Enums via Literals

```typespec
alias Direction is "north" | "south" | "east" | "west";
```

## Best Practices for Type Literals and Aliases

When using type literals and aliases in TypeSpec, follow these best practices:

1. **Use meaningful names**: Choose descriptive names for aliases that indicate their purpose.

2. **Create aliases for reused types**: If a type is used in multiple places, create an alias for it.

3. **Use aliases for complex types**: Create aliases for complex union or intersection types to improve readability.

4. **Document aliases**: Add JSDoc comments to explain the purpose and constraints of each alias.

5. **Be consistent with naming**: Use consistent naming conventions for similar aliases.

6. **Group related aliases**: Keep related aliases together to improve organization.

7. **Prefer literal types for constraints**: Use literal types to create precise constraints when appropriate.

## Common Use Cases

### API Versioning with Aliases

```typespec
alias ApiVersionV1 is "2023-01-01";
alias ApiVersionV2 is "2023-06-01";
alias ApiVersion is ApiVersionV1 | ApiVersionV2;
```

### Resource Identification

```typespec
alias ResourceId is string;
alias ResourceName is string;
alias ResourceIdentifier is ResourceId | ResourceName;
```

### HTTP Status Codes

```typespec
alias SuccessStatusCode is 200 | 201 | 202 | 204;
alias ClientErrorStatusCode is 400 | 401 | 403 | 404;
alias ServerErrorStatusCode is 500 | 502 | 503 | 504;
```

### Response Types

```typespec
model ErrorResponse {
  error: string;
  code: int32;
}

model SuccessResponse<T> {
  data: T;
}

alias ApiResponse<T> is SuccessResponse<T> | ErrorResponse;
```

## Type Literals and Aliases in Generated Output

Different emitters handle type literals and aliases in various ways:

### OpenAPI Output

In OpenAPI, aliases typically become references or inlined types:

```yaml
components:
  schemas:
    Status:
      type: string
      enum:
        - pending
        - active
        - inactive
```

### JSON Schema Output

In JSON Schema, aliases become similar constructs:

```json
{
  "Status": {
    "type": "string",
    "enum": ["pending", "active", "inactive"]
  }
}
```

## When to Use Models vs. Aliases

Understanding when to use models versus aliases is important:

- Use **models** when:

  - You need a named type with a fixed set of properties
  - You want to reuse a type across your API
  - You need to extend from or be extended by other types

- Use **aliases** when:
  - You want to give a meaningful name to an existing type
  - You want to combine existing types without creating a new model
  - You need to refer to a complex type in multiple places

## Summary

Type literals and aliases in TypeSpec provide powerful mechanisms for creating precise type definitions and improving code readability. Type literals allow you to use exact values as types, while aliases enable you to create named references to types. By using these features effectively, you can create more expressive, maintainable, and type-safe API definitions.

This concludes our exploration of the core language features of TypeSpec. With these building blocks, you can create rich, expressive, and well-defined APIs that are both human-readable and machine-processable.
