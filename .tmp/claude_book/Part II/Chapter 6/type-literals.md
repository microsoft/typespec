# Type Literals

Type literals in TypeSpec represent exact, specific values rather than general types. They allow you to create types that are constrained to one or more precise values, providing stronger type checking and clearer API specifications.

## String Literals

String literals represent exact string values:

```typespec
model Theme {
  // The colorScheme property can only be one of these three specific strings
  colorScheme: "light" | "dark" | "system";
}
```

In this example, `colorScheme` must be exactly "light", "dark", or "system" - no other string values are allowed.

## Numeric Literals

Numeric literals represent exact numeric values:

```typespec
model HttpSuccess {
  // The statusCode property can only be one of these specific values
  statusCode: 200 | 201 | 204;
}
```

Here, `statusCode` must be exactly 200, 201, or 204.

## Boolean Literals

Boolean literals represent the exact values `true` or `false`:

```typespec
model FeatureFlag {
  // This property can only be true, not false
  enabled: true;

  // This property can only be false, not true
  deprecated: false;
}
```

While less common than restricting to both boolean values using the `boolean` type, boolean literals are useful in specific scenarios where only one state is valid.

## Using Type Literals in Unions

Type literals are most commonly used in union types to create a set of allowed values:

```typespec
model ApiResponse {
  // Status can only be one of these specific strings
  status: "success" | "error" | "warning";

  // Code can only be one of these specific numbers
  code: 200 | 400 | 401 | 403 | 404 | 500;

  message: string;
}
```

## Type Literals vs. Enums

TypeSpec offers both type literals and enums for representing a set of possible values. Here's a comparison:

```typespec
// Using type literals
model StatusWithLiterals {
  status: "pending" | "active" | "completed" | "canceled";
}

// Using an enum
enum Status {
  Pending: "pending",
  Active: "active",
  Completed: "completed",
  Canceled: "canceled",
}

model StatusWithEnum {
  status: Status;
}
```

Consider these factors when choosing between them:

- **Type literals** are more concise and inline, ideal for simple cases
- **Enums** provide a named type that can be reused and referenced
- **Enums** allow you to attach documentation to each value
- **Enums** are more easily extensible in future versions

## Type Literals in API Definitions

### URL Path Literals

```typespec
import "@typespec/http";
using TypeSpec.Http;

@route("/api")
namespace API {
  @route("/status")
  op getStatus(): {
    // Only these exact values are possible
    status: "up" | "down" | "degraded";

    message: string;
  };
}
```

### Parameter Constraints

```typespec
model QueryParams {
  // Limit the sort direction to exact values
  sortDirection: "asc" | "desc" = "asc";

  // Limit the page size to specific values
  pageSize: 10 | 25 | 50 | 100 = 25;
}
```

### Response Status Codes

```typespec
model SuccessResponse {
  statusCode: 200 | 201;
  data: unknown;
}

model ErrorResponse {
  statusCode: 400 | 401 | 403 | 404 | 500;
  error: string;
}
```

## Creating Type Aliases with Literals

You can create named types from literal unions using the `alias` keyword:

```typespec
alias HttpSuccessCode = 200 | 201 | 204;
alias HttpClientErrorCode = 400 | 401 | 403 | 404;
alias HttpServerErrorCode = 500 | 502 | 503 | 504;

model ApiResponse {
  statusCode: HttpSuccessCode | HttpClientErrorCode | HttpServerErrorCode;
  message: string;
}
```

## Combining Literals with Other Types

Type literals can be combined with other types in union types:

```typespec
model Result {
  // Can be either a specific string or null
  value: string | null;

  // Can be a specific set of strings or any number
  code: "success" | "warning" | "error" | int32;
}
```

## Template Literal Types

TypeSpec supports template literals, which allow you to create string patterns:

```typespec
alias Greeting = `Hello, ${string}!`;
// Represents strings like "Hello, world!", "Hello, TypeSpec!", etc.
```

## Best Practices

1. **Use literals for constrained values**: When a property should only accept specific values, use type literals

2. **Create aliases for reusable sets**: If the same set of literals is used in multiple places, create an alias

3. **Consider documentation needs**: If you need to document each value, prefer enums over literal unions

4. **Balance inline vs. named types**: Use inline literals for simple cases, but prefer named types (aliases or enums) for complex or reused sets

5. **Be consistent**: If you use enums in some places for value sets, continue using enums throughout your API for consistency

6. **Document the meaning of values**: Even with literal types, provide documentation about what each value means in context

By effectively using type literals, you can create more precise API definitions that clearly communicate the exact values allowed for properties, parameters, and responses.
