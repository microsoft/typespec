# 4. Decorators

Decorators are a powerful feature in TypeSpec that allow you to attach metadata and behaviors to your API definitions. This section explores how decorators work in TypeSpec and how to use them effectively to enhance your API specifications.

## Understanding Decorators

Decorators in TypeSpec serve as annotations that add extra information or change the behavior of declarations. They enable:

1. **Adding metadata** - Provide additional information about types or members
2. **Controlling generation** - Influence how emitters process your TypeSpec
3. **Validation** - Enforce constraints and business rules
4. **Protocol specifics** - Define protocol-specific behaviors (HTTP, REST, etc.)

## Decorator Syntax

Decorators are applied using the `@` symbol followed by the decorator name and optional arguments:

```typespec
@decoratorName
@decoratorWithArgument("value")
@decoratorWithMultipleArguments("value1", 42, true)
@decoratorWithNamedArguments({
  name: "value",
  enabled: true,
})
declaration
```

Decorators appear before the declaration they annotate and can be stacked (multiple decorators on a single declaration).

## Built-in Decorators

TypeSpec provides several built-in decorators for common use cases:

### Documentation

The `@doc` decorator adds human-readable documentation:

```typespec
@doc("Represents a user in the system")
model User {
  @doc("Unique identifier for the user")
  id: string;

  @doc("User's full name")
  name: string;
}
```

This documentation is preserved in generated artifacts like OpenAPI specifications.

### Deprecation

Mark elements as deprecated with the `@deprecated` decorator:

```typespec
@deprecated("Use UserV2 instead")
model User {
  id: string;
  name: string;
}
```

### Extended Metadata

Add arbitrary metadata with `@info`:

```typespec
@info({
  owner: "Identity Team",
  reviewers: ["Alice", "Bob"],
  lastReviewed: "2023-05-01",
})
model User {
  id: string;
  name: string;
}
```

## Library-Provided Decorators

Most TypeSpec libraries provide their own decorators for specific functionality:

### HTTP Decorators (from @typespec/http)

HTTP decorators define REST API semantics:

```typespec
import "@typespec/http";
using TypeSpec.Http;

@route("/users")
interface UserOperations {
  @get
  getUsers(): User[];

  @post
  @bodyRoot
  createUser(user: User): User;

  @get
  @route("/{id}")
  getUser(@path id: string): User;
}
```

Key HTTP decorators include:

- `@route` - Define the URL path
- `@get`, `@post`, `@put`, `@delete`, etc. - HTTP methods
- `@path`, `@query`, `@header`, `@body` - Parameter locations
- `@statusCode` - Response status codes

### Validation Decorators

Add validation constraints to your models:

```typespec
model User {
  @minLength(3)
  @maxLength(50)
  username: string;

  @pattern("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$")
  email: string;

  @minValue(0)
  @maxValue(120)
  age?: int32;
}
```

Common validation decorators:

- `@minLength`, `@maxLength` - String length constraints
- `@pattern` - Regular expression pattern
- `@minValue`, `@maxValue` - Numeric range constraints
- `@uniqueItems` - For arrays
- `@format` - String format (like email, date-time, etc.)

### OpenAPI Decorators

Control OpenAPI output with dedicated decorators:

```typespec
import "@typespec/openapi3";
using TypeSpec.OpenAPI;

@service({
  title: "My API",
  version: "1.0.0",
})
@info({
  termsOfService: "https://example.com/terms",
  contact: {
    name: "API Support",
    email: "support@example.com",
  },
  license: {
    name: "MIT",
  },
})
namespace MyAPI;
```

## Decorator Targets

Decorators can be applied to different kinds of declarations:

### Model Decorators

Applied to model declarations:

```typespec
@doc("A user in the system")
@tagged("Identity")
model User {
  id: string;
  name: string;
}
```

### Property Decorators

Applied to model properties:

```typespec
model User {
  @key
  @visibility("read")
  id: string;

  @required
  name: string;

  @secret
  password: string;
}
```

### Operation Decorators

Applied to operations:

```typespec
@doc("Get user details")
@authorize("User")
op getUser(id: string): User;
```

### Parameter Decorators

Applied to operation parameters:

```typespec
op getUser(
  @doc("User identifier")
  @path
  id: string,
): User;
```

### Namespace Decorators

Applied to namespaces:

```typespec
@service({
  title: "User Management API",
})
namespace UserService;
```

## Creating Custom Decorators

For advanced scenarios, you can create custom decorators using JavaScript/TypeScript:

```typescript
// decorators.js
import { createDecoratorDefinition } from "@typespec/compiler";

export const $visibility = createDecoratorDefinition({
  name: "visibility",
  target: "ModelProperty",
  args: [{ name: "level", type: "string" }],
});
```

```typespec
// main.tsp
import "./decorators.js";

model User {
  @visibility("public")
  name: string;

  @visibility("private")
  internalId: string;
}
```

Custom decorators typically require an emitter that understands them.

## Decorator Arguments

Decorators can accept different types of arguments:

### Literal Arguments

Pass literals (strings, numbers, booleans) directly:

```typespec
@maxLength(100)
@doc("User display name")
@enabled(true)
```

### Object Arguments

Pass structured data with object literals:

```typespec
@service({
  title: "My API",
  version: "1.0.0",
  termsOfService: "https://example.com/terms",
})
```

### Type Reference Arguments

Pass type references to decorators:

```typespec
model Error {
  code: string;
  message: string;
}

@error(Error)
op getUser(id: string): User | Error;
```

## Decorator Inheritance

Decorators can be inherited from base models to derived models:

```typespec
@tagged("core")
model Resource {
  id: string;
}

// User inherits the @tagged decorator from Resource
model User extends Resource {
  name: string;
}
```

Some decorators are designed to be inherited, while others only apply to their direct target.

## Decorator Best Practices

Follow these best practices for effective decorator usage:

### 1. Use Standard Decorators When Available

Prefer standard library decorators over custom ones for better compatibility:

```typespec
// Good: Using standard decorators
@maxLength(100)
@pattern("^[A-Za-z0-9]+$")

// Less ideal: Custom decorators for standard concepts
@customMaxLength(100)
@customPattern("^[A-Za-z0-9]+$")
```

### 2. Group Related Decorators

Keep related decorators together and order them consistently:

```typespec
// Good: Logical grouping
@doc("User model")
@access("authenticated")
@resource
model User {
  @key
  @doc("Unique identifier")
  id: string;
}
```

### 3. Keep Decorator Arguments Simple

Avoid overly complex decorator arguments:

```typespec
// Good: Simple, focused arguments
@maxLength(255)
@pattern("^[a-z0-9]+$")

// Avoid: Complex nested structures when possible
@validate({
  length: { min: 1, max: 255 },
  pattern: "^[a-z0-9]+$",
  custom: { /* complex logic */ },
})
```

### 4. Document Custom Decorators

If you create custom decorators, document their purpose and usage:

```typescript
/**
 * Marks a property as containing sensitive information.
 * This will:
 * - Mask the value in logs
 * - Apply encryption at rest
 * - Apply additional authorization checks
 */
export const $sensitive = createDecoratorDefinition({
  name: "sensitive",
  target: "ModelProperty",
});
```

## Common Decorator Patterns

Here are common patterns for using decorators in TypeSpec:

### Resource Modeling

```typespec
@resource
model Pet {
  @key
  id: string;

  name: string;

  @relationship("owner")
  ownerId: string;
}
```

### API Versioning

```typespec
import "@typespec/versioning";
using TypeSpec.Versioning;

@versioned(Versions)
namespace PetStore;

enum Versions {
  v1,
  v2,
  v3,
}

model Pet {
  id: string;
  name: string;

  @added(Versions.v2)
  breed?: string;

  @removed(Versions.v3, "Use 'birthDate' instead")
  age?: int32;

  @added(Versions.v3)
  birthDate?: string;
}
```

### Authentication Requirements

```typespec
import "@typespec/http";
using TypeSpec.Http;

@route("/pets")
interface PetsResource {
  @get
  listPets(): Pet[];

  @post
  @authenticate("jwt")
  createPet(@body pet: Pet): Pet;

  @delete
  @route("/{id}")
  @authorize("admin")
  deletePet(@path id: string): void;
}
```

### Error Mapping

```typespec
@error
model NotFoundError {
  @statusCode
  code: 404;

  message: string;
}

@error
model ValidationError {
  @statusCode
  code: 400;

  details: string[];
}

@route("/users/{id}")
@get
op getUser(@path id: string): User | NotFoundError | ValidationError;
```

## Complete Decorator Example

Here's a comprehensive example demonstrating various decorators in a TypeSpec API:

```typespec
import "@typespec/http";
import "@typespec/rest";
import "@typespec/openapi3";
using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.OpenAPI;

@service({
  title: "Pet Store API",
  version: "1.0.0",
})
@server({
  url: "https://api.petstore.example.com",
  description: "Production server",
})
@info({
  contact: {
    name: "API Support",
    email: "support@petstore.example.com",
  },
  license: {
    name: "MIT",
  },
})
namespace PetStore;

@error
model Error {
  @statusCode
  statusCode: int32;

  @doc("Error code")
  code: string;

  @doc("Human-readable error message")
  message: string;
}

@doc("A pet in the pet store")
@resource
model Pet {
  @key
  @visibility("read")
  @doc("Unique identifier for the pet")
  id: string;

  @required
  @doc("Name of the pet")
  @maxLength(100)
  name: string;

  @doc("Type of animal")
  @pattern("^[A-Za-z]+$")
  type: string;

  @doc("Age of the pet in years")
  @minValue(0)
  @maxValue(100)
  age?: int32;

  @doc("Tags associated with the pet")
  @uniqueItems
  tags?: string[];
}

@route("/pets")
interface PetsResource {
  @doc("List all pets")
  @get
  @pageable
  @filterable
  listPets(
    @query
    @doc("Maximum number of pets to return")
    limit?: int32 = 20,

    @query
    @doc("Type of pet to filter by")
    type?: string,
  ): Pet[] | Error;

  @doc("Create a new pet")
  @post
  @bodyRoot
  @authenticate("api-key")
  createPet(pet: Pet): Pet | Error;

  @doc("Get a specific pet by id")
  @get
  @route("/{id}")
  getPet(
    @doc("The pet ID")
    @path
    id: string,
  ): Pet | Error;

  @doc("Update a pet")
  @put
  @route("/{id}")
  @authenticate("api-key")
  updatePet(@path id: string, @bodyRoot pet: Pet): Pet | Error;

  @doc("Delete a pet")
  @delete
  @route("/{id}")
  @authenticate("api-key")
  @authorize("admin")
  deletePet(@path id: string): void | Error;
}
```

## Next Steps

Now that you understand how decorators enhance your TypeSpec definitions with metadata and behaviors, we'll explore scalars in the next section. Scalars are the basic building blocks for data types in TypeSpec.
