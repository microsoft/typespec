# 7. Operations

Operations are essential elements in TypeSpec that define the actions or behaviors your API can perform. They represent the endpoints of your API, specifying what data goes in (parameters) and what comes out (return types). This section explores how to declare and use operations in TypeSpec.

## Declaring Basic Operations

An operation in TypeSpec is declared using a function-like syntax that specifies the input parameters and return type.

```typespec
operation getUser(id: string): User;
```

This operation takes a string parameter named `id` and returns a `User` model.

### Operation Syntax

The basic syntax for declaring an operation is:

```typespec
operation operationName(param1: Type1, param2: Type2, ...): ReturnType;
```

Each operation consists of:

- The `operation` keyword
- A unique operation name
- Parameters enclosed in parentheses (optional)
- A return type following a colon (optional)

### Operations Without Parameters

Operations can be declared without parameters:

```typespec
operation getCurrentUser(): User;
```

### Operations Without Return Types

Operations can also be declared without specifying a return type, in which case they implicitly return `void`:

```typespec
operation logout();
```

You can also explicitly specify `void` as the return type:

```typespec
operation logout(): void;
```

## Operation Parameters

Parameters allow you to pass information to operations. TypeSpec offers various ways to declare and configure parameters.

### Basic Parameters

The simplest form of parameters are named parameters with specified types:

```typespec
operation updateUser(id: string, userData: UserUpdateRequest): User;
```

### Optional Parameters

Parameters can be marked as optional using the `?` modifier:

```typespec
operation searchUsers(query?: string): User[];
```

Optional parameters can also specify default values:

```typespec
operation listItems(pageSize: int32 = 10, pageNumber: int32 = 1): ItemList;
```

### Rest Parameters

For operations that need to accept a variable number of arguments, you can use rest parameters:

```typespec
operation batchProcess(...items: BatchItem[]): BatchResult;
```

## Return Types

Operations can return various types of data, which are specified after the colon in the operation declaration.

### Single Return Types

Most operations return a single type:

```typespec
operation getProduct(id: string): Product;
```

### Union Return Types

Operations can also return different types based on certain conditions, using union types:

```typespec
operation authenticate(credentials: Credentials): AuthSuccess | AuthFailure;
```

This indicates that the operation might return either an `AuthSuccess` or an `AuthFailure` object.

### Void Return Types

When an operation doesn't return any data, you can use the `void` keyword:

```typespec
operation deleteAccount(id: string): void;
```

## Advanced Operation Features

TypeSpec provides advanced features to make operations more powerful and reusable.

### Operation Documentation

Add documentation to operations using JSDoc-style comments:

```typespec
/**
 * Retrieves a user by their unique identifier.
 * @param id The unique identifier of the user
 * @returns The user's profile information
 */
operation getUser(id: string): User;
```

### Operation Visibility

Control the visibility of operations using the `@visibility` decorator:

```typespec
@visibility("internal")
operation internalOperation(): InternalResult;
```

### Operation Groups

Group related operations using interfaces:

```typespec
interface Users {
  create(user: UserCreateRequest): User;
  get(id: string): User;
  update(id: string, user: UserUpdateRequest): User;
  delete(id: string): void;
}
```

## Operation Templates

Templates allow you to create generic operations that can work with different types.

### Basic Operation Templates

Here's an example of a templated operation:

```typespec
operation get<T>(id: string): T;
```

This operation can be used with different return types:

```typespec
alias getUserOperation is get<User>;
alias getProductOperation is get<Product>;
```

### Multiple Template Parameters

Operations can have multiple template parameters:

```typespec
operation compare<T, U>(left: T, right: U): ComparisonResult;
```

### Template Constraints

You can constrain the types that can be used with a template:

```typespec
operation process<T extends Resource>(resource: T): ProcessedResult<T>;
```

## Reusing Operations

TypeSpec provides several mechanisms for reusing operations.

### Operation Aliases

Create aliases for operations to give them more specific names or context:

```typespec
operation getResource(id: string): Resource;

alias getUser is getResource;
```

### Operation Composition

You can compose operations using various techniques:

```typespec
operation getWithMetadata<T>(
  operation getter(id: string): T
): ResourceWithMetadata<T>;
```

## Operations with Decorators

Decorators can be applied to operations to provide additional metadata or behavior.

### HTTP Method Decorators

When using the HTTP library, you can specify the HTTP method:

```typespec
import "@typespec/http";
using TypeSpec.Http;

@get
operation getUser(id: string): User;

@post
operation createUser(@body user: UserCreateRequest): User;
```

### Path and Query Parameters

Specify path and query parameters using decorators:

```typespec
@route("/users")
operation listUsers(
  @query pageSize: int32 = 10,
  @query pageNumber: int32 = 1
): UserList;

@route("/users/{id}")
operation getUser(@path id: string): User;
```

## Best Practices for Operations

When defining operations in TypeSpec, follow these best practices:

1. **Use meaningful names**: Name operations using verbs that indicate the action being performed.

2. **Be consistent**: Maintain consistent patterns for similar operations (e.g., use `get`, `create`, `update`, `delete` for CRUD operations).

3. **Document everything**: Add JSDoc comments to describe the purpose of each operation and its parameters.

4. **Group related operations**: Use interfaces to group related operations together.

5. **Use appropriate return types**: Be specific about what your operations return, and use union types when multiple return types are possible.

6. **Consider error scenarios**: Include error responses in your return types or use specialized error handling features.

7. **Leverage templates**: Use operation templates to create reusable patterns for common operations.

## Summary

Operations are fundamental building blocks in TypeSpec that define the functional aspects of your API. By using operations effectively, you can create clear, consistent, and well-structured APIs that are easy to understand and use.

In the next section, we'll explore interfaces in TypeSpec, which provide a way to group related operations together.
