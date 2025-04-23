# 1. Declarations and Naming

TypeSpec is a strongly-typed language for defining APIs. A fundamental concept in TypeSpec is the declaration of types and other elements that make up your API definition. This section covers how declarations work in TypeSpec and the rules for naming these elements.

## Understanding Declarations

In TypeSpec, a declaration is a statement that introduces a new named element into your program. TypeSpec supports several kinds of declarations:

- **Namespace declarations** - Containers for organizing related types
- **Model declarations** - Define data structures with properties
- **Scalar declarations** - Define primitive data types
- **Enum declarations** - Define sets of named constants
- **Operation declarations** - Define API operations (functions)
- **Interface declarations** - Group related operations
- **Union declarations** - Define types that can be one of several types
- **Alias declarations** - Create alternative names for existing types

## Declaration Syntax

Most declarations in TypeSpec follow a consistent pattern:

```typespec
[decorators] declaration-keyword identifier [template-parameters] [extends-clause] [body];
```

For example, a simple model declaration looks like this:

```typespec
model User {
  id: string;
  name: string;
  email: string;
}
```

An operation declaration might look like this:

```typespec
op getUser(id: string): User;
```

## Naming Requirements

TypeSpec enforces specific rules for identifiers (names) used in declarations:

### Valid Identifier Characters

- Identifiers must start with a letter (`a-z`, `A-Z`) or underscore (`_`)
- After the first character, identifiers can contain letters, digits (`0-9`), and underscores
- Unicode letters and digits are allowed in identifiers

### Naming Conventions

While TypeSpec doesn't enforce specific naming conventions, the following practices are recommended for consistency:

- **PascalCase** for types (models, interfaces, enums, etc.)

  ```typespec
  model UserProfile { ... }
  interface OrderManagement { ... }
  enum OrderStatus { ... }
  ```

- **camelCase** for properties, parameters, and variables

  ```typespec
  model User {
    firstName: string;
    lastName: string;
  }

  op updateUser(userId: string, userData: User): User;
  ```

- **ALL_CAPS** for enum values representing constants
  ```typespec
  enum LogLevel {
    DEBUG,
    INFO,
    WARNING,
    ERROR,
  }
  ```

### Unique Naming Requirements

TypeSpec requires that names be unique within their scope:

- Each declared identifier must be unique within its namespace
- Property names must be unique within a model
- Parameter names must be unique within an operation
- Enum member names must be unique within an enum

For example, this would cause a naming conflict:

```typespec
model User {
  name: string;
  name: string; // Error: Duplicate property name
}
```

However, the same name can be reused in different scopes:

```typespec
model User {
  id: string;
  name: string;
}

model Product {
  id: string; // Valid: Different scope from User.id
  name: string; // Valid: Different scope from User.name
}
```

### Reserved Keywords

TypeSpec reserves certain words that cannot be used as identifiers:

```
alias     const     enum      false     is        model     namespace null
op        scalar    true      type      union     using     void      interface
extends   projection
```

If you need to use a reserved keyword as an identifier, you can escape it using the backquote (`` ` ``) character:

```typespec
model User {
  `model`: string; // Using "model" as a property name
}
```

### Namespace Qualification

When referring to a type in another namespace, you need to use its fully qualified name or import the namespace:

```typespec
namespace Example {
  model User {
    id: string;
  }
}

namespace AnotherExample {
  // Using fully qualified name
  model UserProfile {
    user: Example.User;
  }
}
```

## Type Name Resolution

When TypeSpec encounters a type name, it resolves it in the following order:

1. Local scope (e.g., template parameters)
2. Current namespace
3. Imported namespaces (via `using` statements)
4. Built-in types (like `string`, `int32`)

This resolution order can affect how names are found and matched in your TypeSpec code.

## Declaration Examples

Let's examine some practical examples of declarations in TypeSpec:

### Model Declaration

```typespec
@doc("Represents a user in the system")
model User {
  @doc("Unique identifier for the user")
  id: string;

  @doc("User's full name")
  name: string;

  @doc("User's email address")
  email: string;

  @doc("User's date of birth")
  dateOfBirth?: string;

  @doc("Whether the user account is active")
  isActive: boolean = true;
}
```

### Interface Declaration

```typespec
interface UserManagement {
  @doc("Get a user by ID")
  getUser(id: string): User;

  @doc("Create a new user")
  createUser(userData: User): User;

  @doc("Update an existing user")
  updateUser(id: string, userData: User): User;

  @doc("Delete a user")
  deleteUser(id: string): void;
}
```

### Enum Declaration

```typespec
@doc("Status of an order in the system")
enum OrderStatus {
  @doc("Order has been placed but not processed")
  Pending,

  @doc("Order is being processed")
  Processing,

  @doc("Order has been shipped")
  Shipped,

  @doc("Order has been delivered")
  Delivered,

  @doc("Order has been canceled")
  Canceled,
}
```

### Operation Declaration

```typespec
@doc("Retrieve a user's profile by ID")
op getUserProfile(
  @doc("The unique identifier of the user")
  userId: string,

  @doc("Whether to include detailed information")
  @query
  includeDetails?: boolean = false,
): {
  @doc("The user's profile information")
  profile: UserProfile;

  @doc("When the profile was last updated")
  lastUpdated: string;
};
```

## Best Practices for Declarations

To maintain clean and readable TypeSpec code, follow these best practices:

1. **Use descriptive names** - Choose names that clearly describe the purpose of the type or element
2. **Be consistent** - Follow the same naming conventions throughout your codebase
3. **Add documentation** - Use the `@doc` decorator to document your declarations
4. **Organize related types** - Group related declarations in the same namespace
5. **Keep declarations focused** - Each declaration should have a single, well-defined purpose

## Next Steps

Now that you understand declarations and naming in TypeSpec, we'll explore how to import TypeSpec files and libraries in the next section, which is an essential part of working with TypeSpec projects of any size.
