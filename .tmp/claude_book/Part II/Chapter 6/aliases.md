# Aliases

Type aliases in TypeSpec allow you to create named references to existing types. They enable you to provide more meaningful names, add documentation, and create reusable type definitions that improve your API's readability and maintainability.

## Basic Alias Syntax

Aliases are created using the `alias` keyword:

```typespec
// Create an alias for a built-in type
alias Email = string;

// Create an alias with additional constraints
@pattern("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}")
alias ValidEmail = string;

// Use the alias in models
model User {
  email: ValidEmail;
  backupEmail?: Email;
}
```

## Aliases for Complex Types

Aliases can reference any type, including complex types, unions, and intersections:

```typespec
// Alias for a union type
alias StatusCode = 200 | 400 | 404 | 500;

// Alias for a model
alias Person = {
  name: string;
  age: int32;
};

// Alias for an array type
alias StringArray = string[];

// Alias for a complex union
alias ResourceId = string | int32 | Guid;
```

## Documenting Aliases

Use the `@doc` decorator to document aliases:

```typespec
@doc("A valid email address that follows standard format")
@pattern("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}")
alias Email = string;

@doc("An ISO 8601 compliant date-time string")
@format("date-time")
alias DateTime = string;
```

## Alias Constraints

You can add constraints to aliases using decorators:

```typespec
@minLength(3)
@maxLength(50)
@doc("A username between 3 and 50 characters")
alias Username = string;

@minValue(1)
@maxValue(100)
@doc("A percentage value between 1 and 100")
alias Percentage = int32;
```

## Aliases with Template Literals

You can create aliases for template literals, which are useful for string patterns:

```typespec
// Template literal with string interpolation
alias Greeting = `Hello, ${string}!`;

// Template literal with specific types
alias ResourcePath = `/api/${string}/${int32}`;
```

## Nesting Aliases

Aliases can reference other aliases:

```typespec
alias PositiveInteger = int32;

@minValue(1)
@maxValue(100)
alias SmallPositiveInteger = PositiveInteger;

@minValue(100)
alias LargePositiveInteger = PositiveInteger;
```

## Aliases vs. Models

TypeSpec provides both aliases and models for naming types. Here's a comparison:

```typespec
// Using an alias
alias PersonAlias = {
  name: string;
  age: int32;
};

// Using a model
model PersonModel {
  name: string;
  age: int32;
}
```

Key differences:

- **Aliases** are essentially type names that refer to another type
- **Models** create a new distinct type
- Aliases **cannot be decorated** (though the aliased type can have decorators)
- Models **can be decorated** directly
- Aliases **cannot be extended** with inheritance
- Models **can be extended** with the `extends` keyword

## Common Uses for Aliases

### Simple Semantic Types

```typespec
alias UserId = string;
alias EmailAddress = string;
alias PhoneNumber = string;
alias TimestampUtc = utcDateTime;
```

### Unions of Values

```typespec
alias HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
alias ErrorCode = 400 | 401 | 403 | 404 | 500;
alias Environment = "dev" | "test" | "staging" | "prod";
```

### Complex Response Types

```typespec
alias PaginatedResponse<T> = {
  items: T[];
  count: int32;
  totalCount: int32;
  pageIndex: int32;
  pageSize: int32;
};

alias ApiResponse<T> = {
  data: T;
  metadata: {
    requestId: string;
    timestamp: utcDateTime;
  };
};
```

### Type Constraints

```typespec
@minValue(0)
alias NonNegativeInteger = int32;

@minLength(1)
alias NonEmptyString = string;
```

## Best Practices

1. **Use descriptive names**: Choose names that clearly communicate the purpose or constraints of the type.

2. **Document with @doc**: Add documentation to explain what the alias represents and any constraints or expectations.

3. **Group related aliases**: Keep related aliases together in your code for better organization.

4. **Use for semantic meaning**: Create aliases to provide semantic meaning rather than just for shorter names.

5. **Consider scope**: Define aliases at the appropriate scope – namespace level for broad reuse, or locally for specific contexts.

6. **Be consistent**: Follow a consistent naming pattern for similar aliases.

7. **Choose aliases vs. models appropriately**:
   - Use aliases for simple type references and value unions
   - Use models for complex structures that need decorators or inheritance

## When to Use Aliases vs. Other Type Constructs

| Use Case                             | Best Construct                         |
| ------------------------------------ | -------------------------------------- |
| Simple alternative name for a type   | Alias                                  |
| Semantic type with constraints       | Alias with decorators                  |
| Set of allowed values                | Alias with union of literals (or Enum) |
| Complex structure needing decorators | Model                                  |
| Type that will be extended           | Model                                  |
| Reusable response pattern            | Alias (or Model with generics)         |

By effectively using aliases, you can create more expressive, self-documenting, and maintainable TypeSpec definitions that clearly communicate the semantics of your API types.
