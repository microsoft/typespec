# Intersections

Intersection types in TypeSpec allow you to combine multiple types into one, creating a type that has all the properties of each constituent type. This is particularly useful when you need to compose complex types from simpler ones.

## Basic Intersection Syntax

Intersection types are created using the `&` operator between the types you want to combine:

```typespec
model SuccessResponse {
  status: 200 | 201;
  message: string;
}

model WithPagination {
  page: int32;
  pageSize: int32;
  totalCount: int32;
}

// An intersection combining both types
model PaginatedResponse is SuccessResponse & WithPagination;
```

In this example, `PaginatedResponse` will have all properties from both `SuccessResponse` and `WithPagination`.

## Combining Multiple Types

You can combine more than two types in an intersection:

```typespec
model Timestamps {
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model Auditable {
  createdBy: string;
  updatedBy: string;
}

model Resource {
  id: string;
  name: string;
}

// Combines all three types
model AuditableResource is Resource & Timestamps & Auditable;
```

The resulting `AuditableResource` model will have all properties from all three source models.

## Intersections with HTTP Response Types

Intersections are commonly used with HTTP response types:

```typespec
import "@typespec/http";
using TypeSpec.Http;

model User {
  id: string;
  name: string;
  email: string;
}

op createUser(@body user: User): CreatedResponse & User;
```

Here, the return type is an intersection of `CreatedResponse` (which includes a 201 status code) and the `User` model.

## Combining Models with Anonymous Types

You can use intersections with anonymous object types:

```typespec
model BaseUser {
  id: string;
  name: string;
}

model DetailedUser
  is BaseUser & {
    email: string;
    phone: string;
    address: Address;
  };
```

## Property Merging Rules

When types in an intersection have properties with the same name, TypeSpec follows these rules:

1. Properties with the same name and compatible types are merged
2. Properties with the same name but incompatible types will cause a type error

Example with compatible types:

```typespec
model ModelA {
  prop: string | int32;
}

model ModelB {
  prop: string | boolean;
}

// Valid: 'prop' will be of type 'string | int32 | boolean'
model Combined is ModelA & ModelB;
```

Example with incompatible types:

```typespec
model ModelA {
  prop: string;
}

model ModelB {
  prop: int32; // Different type from ModelA.prop
}

// Error: Incompatible types for 'prop'
model Combined is ModelA & ModelB;
```

## Real-world Examples

### Combining Capability Sets

```typespec
model ReadCapabilities {
  canRead: boolean;
}

model WriteCapabilities {
  canWrite: boolean;
}

model DeleteCapabilities {
  canDelete: boolean;
}

model ReadWriteCapabilities is ReadCapabilities & WriteCapabilities;
model FullAccess is ReadCapabilities & WriteCapabilities & DeleteCapabilities;
```

### Enhancing Resource Models

```typespec
model Resource {
  id: string;
  name: string;
}

model WithMetadata {
  metadata: Record<string>;
}

model WithTags {
  tags: string[];
}

model EnhancedResource is Resource & WithMetadata & WithTags;
```

### HTTP Response Patterns

```typespec
import "@typespec/http";
using TypeSpec.Http;

model User {
  id: string;
  name: string;
}

// Success response with a user
op getUser(id: string): OkResponse & User;

// Success response with a list of users and pagination
op listUsers(@query page: int32 = 1, @query pageSize: int32 = 10): OkResponse & {
  items: User[];
  page: int32;
  pageSize: int32;
  totalCount: int32;
};
```

## When to Use Intersections vs. Other Composition Methods

TypeSpec offers multiple ways to compose types:

1. **Intersection (`&`)**: Combines types without establishing an inheritance relationship
2. **Spread operator (`...`)**: Copies properties from one model to another
3. **Extends keyword**: Creates an inheritance relationship

Choose intersections when:

- You want to combine independent types without inheritance
- You're combining types for a specific use case
- You're building complex response types

Choose spread when:

- You want to reuse properties from another model
- You're building a model hierarchy without formal inheritance

Choose extends when:

- There's a clear "is-a" relationship
- You want to establish a formal inheritance hierarchy

## Best Practices

1. **Keep intersections readable**: Avoid overly complex intersections with many types

2. **Document the purpose**: Comment why you're combining specific types

3. **Be mindful of name collisions**: Properties with the same name must have compatible types

4. **Consider type aliases**: For complex intersections, create a named type using the `model` keyword rather than using inline intersections

5. **Prefer composition over inheritance**: Use intersections to build composable, reusable types

6. **Use with HTTP responses**: Intersections work particularly well for combining status codes with response bodies

By understanding and effectively using intersection types, you can create more composable and DRY (Don't Repeat Yourself) TypeSpec definitions.
