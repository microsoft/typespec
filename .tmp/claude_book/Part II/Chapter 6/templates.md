# Templates

Templates in TypeSpec provide a powerful mechanism for creating reusable, generic type definitions. They allow you to define a type once and use it with different concrete types, promoting code reuse and consistency.

## Basic Template Syntax

Template types are defined by adding type parameters in angle brackets (`<>`) after the type name:

```typespec
// A template model with a single type parameter T
model Result<T> {
  data: T;
  success: boolean;
  timestamp: utcDateTime;
}
```

You can then use this template with specific types:

```typespec
// Using the template with a User type
model UserResult is Result<User>;

// Using the template with a Product type
model ProductResult is Result<Product>;
```

The `UserResult` model will effectively have this structure:

```typespec
model UserResult {
  data: User;
  success: boolean;
  timestamp: utcDateTime;
}
```

## Multiple Template Parameters

Templates can have multiple type parameters:

```typespec
model KeyValuePair<K, V> {
  key: K;
  value: V;
}

// Usage with different type combinations
model StringToInt is KeyValuePair<string, int32>;
model UserToRole is KeyValuePair<User, Role>;
```

## Template Constraints

You can constrain template parameters to ensure they have specific characteristics using the `extends` keyword:

```typespec
// Constraint requiring the type to have an 'id' property
model Entity<T extends {id: string}> {
  data: T;
  createdAt: utcDateTime;
}

// This will work because User has an 'id' property
model UserEntity is Entity<User>;

// This would cause an error if Product doesn't have an 'id' property
model ProductEntity is Entity<Product>;
```

Constraints are useful for ensuring that template parameters meet specific requirements needed for the template to function correctly.

## Default Template Parameters

Templates can have default types for parameters:

```typespec
model Optional<T, DefaultType = null> {
  value?: T;
  hasValue: boolean;
  defaultValue: DefaultType;
}

// Uses the default (null) for the second parameter
model OptionalString is Optional<string>;

// Explicitly provides the second parameter
model OptionalStringWithDefault is Optional<string, string>;
```

## Nested Templates

Templates can be nested, allowing for more complex type constructions:

```typespec
model Paginated<T> {
  items: T[];
  pageNumber: int32;
  pageSize: int32;
  totalCount: int32;
}

model Result<T> {
  data: T;
  success: boolean;
}

// Nesting templates
model PaginatedResult<T> is Result<Paginated<T>>;

// Using the nested template
model UserListResult is PaginatedResult<User>;
```

## Template Type Aliases

You can create template type aliases:

```typespec
// Template alias
alias ApiResponse<T> = {
  data: T;
  metadata: {
    requestId: string;
    timestamp: utcDateTime;
  };
};

// Using the template alias
alias UserResponse = ApiResponse<User>;
```

## Operations with Templates

Templates can be used with operations:

```typespec
// Template operation
op get<T>(id: string): Result<T>;

// Template interface
interface Repository<T extends {id: string}> {
  get(id: string): T;
  list(): T[];
  create(item: T): T;
  update(id: string, item: T): T;
  delete(id: string): void;
}
```

## Common Template Patterns

### Resource Collections

```typespec
model Collection<T> {
  items: T[];
  count: int32;
  nextLink?: string;
}

model UserCollection is Collection<User>;
model ProductCollection is Collection<Product>;
```

### API Responses

```typespec
model ApiResponse<T, E = Error> {
  data?: T;
  error?: E;
  success: boolean;
  statusCode: int32;
}

model UserResponse is ApiResponse<User>;
model ProductResponse is ApiResponse<Product, ProductError>;
```

### Pagination

```typespec
model PagedResult<T> {
  items: T[];
  page: int32;
  pageSize: int32;
  totalPages: int32;
  totalCount: int32;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
```

### Optional Values

```typespec
model Optional<T> {
  value?: T;
  hasValue: boolean;
}
```

### CRUD Operations

```typespec
interface CrudOperations<T extends {id: string}> {
  create(item: T): T;
  read(id: string): T;
  update(id: string, item: T): T;
  delete(id: string): void;
  list(): T[];
}
```

## Built-in Templates

TypeSpec provides several built-in templates for common patterns:

### Array Template

```typespec
// Built-in array template
model StringArray is Array<string>;
```

### Record Template

```typespec
// Record of string to string
model StringRecord is Record<string>;

// Record of string to User
model UserRecord is Record<User>;
```

### Property Modifiers

```typespec
model User {
  id: string;
  name: string;
  email: string;
  role: string;
}

// Makes all properties optional
model PartialUser is OptionalProperties<User>;

// Selects only specific properties
model UserSummary is PickProperties<User, "id" | "name">;

// Omits specific properties
model PublicUser is OmitProperties<User, "id">;
```

## Template Resolution

TypeSpec resolves templates by substituting the template parameters with the provided types:

```typespec
model Wrapper<T> {
  value: T;
  description: string;
}

// The resolved type is:
// model StringWrapper {
//   value: string;
//   description: string;
// }
model StringWrapper is Wrapper<string>;
```

## Template Specialization

While TypeSpec doesn't support direct template specialization like C++, you can achieve similar effects with unions and discriminators:

```typespec
model GenericResult<T> {
  data: T;
  success: boolean;
}

// Specialized handling for string results
model StringResult {
  data: string;
  success: boolean;
  length: int32;  // Additional property for strings
}

// Union to handle both generic and specialized cases
union Result<T> {
  generic: T extends string ? never : GenericResult<T>,
  string: T extends string ? StringResult : never,
}
```

## Benefits of Templates

1. **Reusability**: Define patterns once and reuse them with different types
2. **Type Safety**: Ensure consistent structure across related types
3. **DRY Code**: Avoid duplicating similar type definitions
4. **Consistency**: Enforce consistent patterns across your API
5. **Flexibility**: Create generic components that work with various types

## Best Practices

1. **Keep templates simple**: Templates should solve generic problems, not specific ones

2. **Document template parameters**: Use `@doc` to clarify what each parameter represents

3. **Use constraints appropriately**: Add constraints to prevent misuse, but don't make them overly restrictive

4. **Consider naming**: Use descriptive names for both the template and its parameters

5. **Limit template nesting**: While powerful, deeply nested templates can become hard to understand

6. **Apply meaningful defaults**: When using default parameters, choose sensible defaults

7. **Leverage built-in templates**: Use TypeSpec's built-in templates when they fit your needs

By effectively using templates, you can create more maintainable, consistent, and reusable TypeSpec definitions with less duplication.
