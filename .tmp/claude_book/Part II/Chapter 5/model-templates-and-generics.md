# Model Templates and Generics

Model templates in TypeSpec allow you to define generic models with type parameters. This powerful feature enables you to create reusable model patterns that can work with different types, providing flexibility and reducing code duplication.

## Basic Template Syntax

A template model is defined using angle brackets (`<>`) after the model name to specify one or more type parameters:

```typespec
model Container<T> {
  value: T;
  metadata: string;
}
```

In this example, `Container` is a generic model with a type parameter `T`. The `value` property is of type `T`, which will be specified when the template is used.

## Using Template Models

You can use template models by providing concrete types for the parameters:

```typespec
model User {
  id: string;
  name: string;
}

// Use the Container template with User as the type parameter
model UserContainer is Container<User>;
```

The `UserContainer` model is equivalent to:

```typespec
model UserContainer {
  value: User;
  metadata: string;
}
```

## Multiple Type Parameters

Template models can have multiple type parameters:

```typespec
model KeyValuePair<K, V> {
  key: K;
  value: V;
}

// Using multiple type parameters
model StringToUser is KeyValuePair<string, User>;
```

The `StringToUser` model is equivalent to:

```typespec
model StringToUser {
  key: string;
  value: User;
}
```

## Default Type Parameters

TypeSpec doesn't directly support default type parameters in the language syntax, unlike some programming languages. Each type parameter must be explicitly specified when using a template model.

## Template Constraints

TypeSpec doesn't have a direct syntax for constraining template types. However, you can document the expected constraints or validate them at runtime through other mechanisms.

## Template Composition

Template models can be composed together to create more complex structures:

```typespec
model Pageable<T> {
  items: T[];
  nextLink?: string;
}

model Response<T> {
  value: T;
  statusCode: int32;
}

// Combining templates
model PagedResponse<T> is Response<Pageable<T>>;

// Using the composed template
model UserList is PagedResponse<User>;
```

The `UserList` model is equivalent to:

```typespec
model UserList {
  value: {
    items: User[];
    nextLink?: string;
  };
  statusCode: int32;
}
```

## Template Inheritance

Template models can extend other models or other template models:

```typespec
model Entity {
  id: string;
}

model Resource<T> extends Entity {
  properties: T;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model UserResource is Resource<User>;
```

The `UserResource` model inherits from `Entity` (via `Resource`) and includes the type-specific properties from `User`.

## The `is` Operator with Templates

The `is` operator creates a new named model based on a template instantiation:

```typespec
model Result<T> {
  data: T;
  success: boolean;
  errorMessage?: string;
}

model UserResult is Result<User>;
```

This creates a new model `UserResult` that is equivalent to `Result<User>` with the type parameter `T` replaced by `User`.

## Using Spread with Templates

The spread operator can be used with templates for flexible composition:

```typespec
model WithMetadata<T> {
  ...T;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
  createdBy: string;
}

model User {
  id: string;
  name: string;
  email: string;
}

model AuditedUser is WithMetadata<User>;
```

The `AuditedUser` model will have all properties from `User` plus the additional metadata properties.

## Recursive Templates

Templates can reference themselves, enabling recursive data structures:

```typespec
model TreeNode<T> {
  value: T;
  children: TreeNode<T>[];
}

model CategoryNode
  is TreeNode<{
    name: string;
    description: string;
  }>;
```

This creates a tree structure where each node contains a value and a list of child nodes of the same type.

## Built-in Template Models

TypeSpec provides several built-in template models for common patterns:

```typespec
// Creates a model with only properties visible during the "Create" lifecycle phase
model CreateUser is Create<User>;

// Creates a model with only properties visible during the "Update" lifecycle phase
model UpdateUser is Update<User>;

// Creates a model with only properties visible during the "Read" lifecycle phase
model ReadUser is Read<User>;

// Creates a model for use in query parameters
model QueryUser is Query<User>;
```

These built-in templates work with the `@visibility` decorator to create appropriate views of models for different operations.

## Friendly Naming for Templates

For templates, you can use the `@friendlyName` decorator to create more descriptive names based on the template parameters:

```typespec
@friendlyName("{name}Response")
model Response<T> {
  value: T;
}

model User {
  id: string;
  name: string;
}

// Will have the friendly name "UserResponse"
model UserResponse is Response<User>;
```

## Best Practices

- **Use descriptive parameter names**: Choose parameter names like `T`, `K`, `V`, or more descriptive names that indicate the purpose.
- **Document template parameters**: Comment your code to explain the expected types for parameters.
- **Keep templates focused**: Design templates to serve a single, clear purpose.
- **Use templates for patterns**: Use templates to capture repeating patterns in your API design.
- **Use `is` for clarity**: When instantiating complex templates, use the `is` operator to create named models for better readability.
- **Consider composition**: Combine templates with spread and inheritance for maximum flexibility.
- **Avoid excessive nesting**: Deeply nested template instantiations can be hard to understand.

By effectively using model templates, you can create reusable, type-safe patterns in your API design, leading to more maintainable and consistent API definitions.
