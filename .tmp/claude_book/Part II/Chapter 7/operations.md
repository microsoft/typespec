# Operations

Operations in TypeSpec represent the actions or endpoints that can be invoked in your API. They define the request parameters, return types, and error responses for each action, forming the behavioral contract of your API.

## Basic Operation Syntax

Operations are declared using the `op` keyword, followed by the operation name, parameters in parentheses, and the return type:

```typespec
op getUserById(id: string): User;
```

This declares an operation named `getUserById` that takes a string parameter `id` and returns a `User` object.

## Operation Parameters

Operations can have zero or more parameters:

```typespec
// No parameters
op getServiceStatus(): ServiceStatus;

// Single parameter
op getUserById(id: string): User;

// Multiple parameters
op searchUsers(query: string, maxResults?: int32, includeInactive?: boolean): User[];
```

Parameters can be optional by appending a question mark (`?`) to the parameter name.

## Return Types

Operations must specify a return type, which indicates what the operation produces:

```typespec
// Return a single object
op getUser(id: string): User;

// Return an array of objects
op listUsers(): User[];

// Return void (no content)
op deleteUser(id: string): void;

// Return a union (success or error)
op createUser(user: User): User | ValidationError;
```

## Named Parameters

For clarity, especially with multiple parameters, you can use a model to define the parameters:

```typespec
model GetUserParams {
  id: string;
}

op getUser(params: GetUserParams): User;
```

This approach is particularly helpful when parameters grow in number or complexity.

## Grouping Related Parameters

You can use anonymous models to group related parameters:

```typespec
op searchUsers(
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
): UserSearchResult;
```

## Documentation for Operations

Like other TypeSpec elements, operations can be documented with decorators:

```typespec
@doc("Retrieve a user by their unique identifier")
op getUserById(
  @doc("The user's unique identifier")
  id: string,
): User;
```

You can also provide specific documentation for the operation's return value and error responses:

```typespec
@doc("Create a new user account")
@returnsDoc("The newly created user")
@errorsDoc("Validation errors if the user data is invalid")
op createUser(user: User): User | ValidationError;
```

## Operation With Multiple Response Types

Operations often need to return different responses based on the outcome. Union types are used to represent these possibilities:

```typespec
@error
model NotFoundError {
  code: "NotFound";
  message: string;
}

@error
model ValidationError {
  code: "ValidationError";
  message: string;
  details: string[];
}

op getUserById(id: string): User | NotFoundError;

op createUser(user: User): User | ValidationError;
```

The `@error` decorator marks models that represent error responses, making it clear which return types indicate errors.

## Operation Overloading

TypeSpec supports operation overloading using the `@overload` decorator, which allows you to define multiple variants of an operation with different parameters or return types:

```typespec
op getUserById(id: string): User | NotFoundError;

@overload
op getUserById(username: string, type: "username"): User | NotFoundError;

@overload
op getUserById(email: string, type: "email"): User | NotFoundError;
```

This allows clients to call the same operation in different ways.

## Operation Templates

You can create operation templates that can be reused with different types:

```typespec
op getById<T>(id: string): T | NotFoundError;

op getUser is getById<User>;
op getProduct is getById<Product>;
```

This approach promotes consistency and reduces duplication in your API definition.

## Operation Decorators

Operations can be decorated with additional metadata to specify behaviors or constraints:

```typespec
@tag("Users")
@doc("Create a new user")
op createUser(@body user: User): User | ValidationError;
```

Common operation decorators include:

- `@tag`: Categorizes operations for documentation and organization
- `@doc`: Provides documentation
- `@deprecated`: Marks an operation as deprecated
- `@example`: Provides example requests and responses

## Operation Organization

There are different ways to organize operations in your TypeSpec code:

### Standalone Operations

Operations can be defined at the namespace level:

```typespec
namespace PetStore {
  op getPet(id: string): Pet;
  op listPets(): Pet[];
  op createPet(pet: Pet): Pet;
  op updatePet(id: string, pet: Pet): Pet;
  op deletePet(id: string): void;
}
```

### Interface-Grouped Operations

Operations can be grouped in interfaces to organize related functionality:

```typespec
namespace PetStore {
  interface Pets {
    get(id: string): Pet;
    list(): Pet[];
    create(pet: Pet): Pet;
    update(id: string, pet: Pet): Pet;
    delete(id: string): void;
  }
}
```

This approach helps organize operations that share a common resource or domain concept.

## Best Practices

### Naming Conventions

- Use camelCase for operation names
- Use verbs or verb phrases that describe the action being performed
- Be consistent with naming patterns across similar operations
- Consider using standard prefixes like `get`, `list`, `create`, `update`, `delete`

### Parameter Design

- Keep the number of parameters manageable
- Group related parameters into models for complex operations
- Use optional parameters for non-required values
- Document all parameters clearly

### Return Types

- Be explicit about possible error responses using union types
- Return appropriate HTTP status codes (when using HTTP libraries)
- Use consistent return types for similar operations

### Documentation

- Document the purpose of each operation
- Provide examples for complex operations
- Document error conditions and how to handle them
- Include information about any side effects

### Organization

- Group related operations together in interfaces
- Keep operations focused on specific tasks
- Design operations around resources or business capabilities
- Consider how operations will be discovered and used by clients

By following these practices, you can create well-designed operations that form a clean, consistent, and usable API contract.
