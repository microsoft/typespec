# Operation Parameters

Operation parameters in TypeSpec define the inputs that an operation accepts. They are a crucial part of defining your API's contract, specifying what data clients need to provide when invoking operations.

## Basic Parameter Syntax

Parameters are declared within the parentheses of an operation declaration, using the format `name: type`:

```typespec
op getUserById(id: string): User;
```

This operation has a single parameter named `id` of type `string`.

## Multiple Parameters

Operations can have multiple parameters, separated by commas:

```typespec
op searchUsers(query: string, maxResults: int32, sortBy: string): User[];
```

## Optional Parameters

Parameters can be marked as optional by appending a question mark (`?`) to the parameter name:

```typespec
op searchUsers(query: string, maxResults?: int32, sortBy?: string): User[];
```

In this example, `query` is required, while `maxResults` and `sortBy` are optional.

## Parameter Documentation

Like other TypeSpec elements, parameters can be documented using the `@doc` decorator:

```typespec
op searchUsers(
  @doc("Search query string")
  query: string,

  @doc("Maximum number of results to return")
  maxResults?: int32,

  @doc("Field to sort results by")
  sortBy?: string,
): User[];
```

## Complex Parameter Types

Parameters can have complex types, not just primitives:

```typespec
model SearchCriteria {
  query: string;
  filters?: {
    category?: string;
    minPrice?: decimal;
    maxPrice?: decimal;
    tags?: string[];
  };
  sort?: {
    field: string;
    direction: "asc" | "desc";
  };
}

op searchProducts(criteria: SearchCriteria): ProductSearchResult;
```

Using models for complex parameters improves readability and reusability.

## Protocol-Specific Parameter Decorators

When using protocol-specific libraries like `@typespec/http`, parameters can be decorated to indicate how they should be transmitted:

```typespec
import "@typespec/http";
using TypeSpec.Http;

@route("/users")
interface Users {
  @get
  getUser(@path id: string): User;

  @get
  searchUsers(@query query: string, @query maxResults?: int32, @query sortBy?: string): User[];

  @post
  createUser(@body user: User): User;

  @put
  updateUser(@path id: string, @body user: User): User;

  @patch
  partiallyUpdateUser(@path id: string, @body updates: UserPatch): User;
}
```

Common HTTP parameter decorators include:

- `@path`: Parameter is part of the URL path
- `@query`: Parameter is a query string parameter
- `@header`: Parameter is an HTTP header
- `@body`: Parameter is in the request body
- `@cookie`: Parameter is a cookie

## Parameter Constraints

Parameters can have constraints applied using decorators:

```typespec
op getPaginatedResults(
  @minValue(1)
  @maxValue(100)
  pageSize?: int32,

  @minLength(1)
  @maxLength(50)
  continuationToken?: string,
): PaginatedResult;
```

Common constraint decorators include:

- `@minValue` / `@maxValue`: For numeric constraints
- `@minLength` / `@maxLength`: For string length constraints
- `@pattern`: For string format validation using regular expressions
- `@minItems` / `@maxItems`: For array size constraints

## Default Parameter Values

TypeSpec doesn't directly support default values for parameters in the language syntax. However, default values can be documented in the parameter description and implemented in the actual API.

```typespec
op searchUsers(
  @doc("Search query string")
  query: string,

  @doc("Maximum number of results to return (default: 20)")
  maxResults?: int32,

  @doc("Field to sort results by (default: 'name')")
  sortBy?: string,
): User[];
```

## Parameter Grouping Strategies

There are several strategies for organizing operation parameters:

### 1. Individual Parameters

Best for operations with a small number of simple parameters:

```typespec
op getUser(id: string): User;
```

### 2. Anonymous Object Parameter

Useful for grouping related parameters:

```typespec
op searchUsers(
  options: {
    query: string;
    maxResults?: int32;
    sortBy?: string;
  },
): User[];
```

### 3. Named Model Parameter

Best for complex parameter sets that may be reused:

```typespec
model UserSearchParams {
  query: string;
  maxResults?: int32;
  sortBy?: string;
}

op searchUsers(params: UserSearchParams): User[];
```

### 4. Multiple Grouped Parameters

Useful for separating concerns:

```typespec
op searchProducts(
  // Search criteria
  criteria: {
    query: string;
    category?: string;
    tags?: string[];
  },

  // Pagination options
  pagination: {
    pageSize?: int32;
    pageToken?: string;
  },

  // Sort options
  sort?: {
    field: string;
    direction: "asc" | "desc";
  },
): ProductSearchResult;
```

## Parameter Inheritance

When using interface inheritance, operations in derived interfaces inherit the parameter definitions from base interfaces:

```typespec
interface ReadOperations<T> {
  get(id: string): T;
  list(maxResults?: int32): T[];
}

interface FilterableReadOperations<T> extends ReadOperations<T> {
  // Inherits get(id: string) from ReadOperations
  // Overrides list with additional parameter
  list(maxResults?: int32, filter?: string): T[];
}
```

## Template Parameters

Parameters can reference template types:

```typespec
op create<T>(item: T): T;

// Used with specific types
op createUser is create<User>;
op createProduct is create<Product>;
```

## Best Practices

### Parameter Design

- **Use descriptive names**: Choose parameter names that clearly indicate their purpose.
- **Follow consistent casing**: Use camelCase for parameter names.
- **Group related parameters**: Use models to group related parameters for complex operations.
- **Limit parameter count**: Keep the number of parameters manageable (typically fewer than 5-7 direct parameters).
- **Use optional judiciously**: Only mark parameters as optional if they can be meaningfully omitted.

### Documentation

- **Document all parameters**: Provide clear descriptions for what each parameter does.
- **Include constraints**: Document any constraints on parameter values.
- **Document default values**: If parameters have default values, document them.

### Constraints and Validation

- **Add appropriate constraints**: Use constraint decorators to enforce validation rules.
- **Consider client usability**: Balance strict validation with usability for API clients.
- **Be consistent**: Apply similar constraints consistently across similar parameters.

### Versioning and Evolution

- **Plan for extension**: Design parameters with future extensibility in mind.
- **Use optional for new parameters**: When adding parameters in newer versions, make them optional.
- **Consider backward compatibility**: Avoid removing or changing existing parameters if possible.

By following these guidelines, you can create well-designed operation parameters that make your API intuitive, consistent, and easy to use.
