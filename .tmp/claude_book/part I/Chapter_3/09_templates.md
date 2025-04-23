# 9. Templates

Templates are a powerful feature in TypeSpec that enable you to create reusable, generic definitions that can work with different types. They allow you to define a pattern once and reuse it with various types, making your code more concise and maintainable. This section explores how to create and use templates in TypeSpec.

## Understanding Templates

Templates in TypeSpec are similar to generics in programming languages like TypeScript or C#. They let you parameterize types, models, operations, interfaces, and more, allowing you to write code that can work with multiple types while maintaining type safety.

## Basic Template Syntax

The basic syntax for defining a template parameter uses angle brackets (`<` and `>`):

```typespec
model Container<T> {
  value: T;
}
```

This `Container` model can hold any type, specified when you use it:

```typespec
model StringContainer is Container<string>;
model NumberContainer is Container<int32>;
```

## Template Parameters for Different TypeSpec Elements

Templates can be applied to various TypeSpec elements:

### Templated Models

```typespec
model Pair<T, U> {
  first: T;
  second: U;
}

model StringNumberPair is Pair<string, int32>;
```

### Templated Operations

```typespec
operation fetch<T>(id: string): T;

alias fetchUser is fetch<User>;
alias fetchProduct is fetch<Product>;
```

### Templated Interfaces

```typespec
interface Repository<T> {
  get(id: string): T;
  list(): T[];
  create(item: T): T;
  update(id: string, item: T): T;
  delete(id: string): void;
}

alias UserRepository is Repository<User>;
```

### Templated Scalars

```typespec
scalar Vector<T extends numeric>;

alias Vector3D is Vector<float32>;
```

## Multiple Template Parameters

Templates can have multiple parameters:

```typespec
model KeyValuePair<K, V> {
  key: K;
  value: V;
}

model ConfigSetting is KeyValuePair<string, string>;
model UserPreference is KeyValuePair<string, boolean>;
```

## Template Parameter Constraints

You can constrain template parameters to ensure they meet specific requirements:

```typespec
model Entity {
  id: string;
  createdAt: utcDateTime;
  updatedAt: utcDateTime;
}

model Repository<T extends Entity> {
  items: T[];
}
```

This ensures that `T` must be or extend the `Entity` model.

## Default Template Parameters

Templates can specify default values for parameters:

```typespec
model Paginated<T, PageSize extends int32 = 10> {
  items: T[];
  pageSize: PageSize;
  pageNumber: int32;
  totalPages: int32;
}

// Uses default page size of 10
model UserList is Paginated<User>;

// Explicitly sets page size to 25
model ProductList is Paginated<Product, 25>;
```

## Named Template Arguments

When using templates with multiple parameters, you can use named arguments for clarity:

```typespec
model CacheEntry<K, V, TTL extends int32 = 3600> {
  key: K;
  value: V;
  timeToLive: TTL;
}

// Using positional arguments
model UserCache is CacheEntry<string, User, 7200>;

// Using named arguments
model ProductCache is CacheEntry<
  K: string,
  V: Product,
  TTL: 1800
>;
```

## Template Argument Inference

In some cases, TypeSpec can infer template arguments:

```typespec
model Result<T> {
  value: T;
  successful: boolean;
}

// The type parameter is inferred from the property type
model UserResult extends Result {
  value: User;
}
```

## Nested Templates

Templates can be nested to create more complex structures:

```typespec
model Response<T> {
  data: T;
  metadata: ResponseMetadata;
}

model Paginated<T> {
  items: T[];
  page: int32;
  pageSize: int32;
}

// Nested template usage
model PaginatedUsersResponse is Response<Paginated<User>>;
```

## Templates with Unions and Intersections

Templates can be used with union and intersection types:

```typespec
model Result<T, E> {
  value: T | null;
  error: E | null;
}

model ApiResult<T> is Result<T, ApiError>;
```

## Conditional Types with Templates

TypeSpec supports conditional types in templates:

```typespec
model WithOptionalId<T, HasId extends boolean> {
  ...T;
  id: HasId extends true ? string : void;
}

model UserWithId is WithOptionalId<User, true>;
model UserWithoutId is WithOptionalId<User, false>;
```

## Template Specialization

You can create specialized versions of templates for specific types:

```typespec
model Box<T> {
  value: T;
}

// Specialization for string
model Box<string> {
  value: string;
  length: int32;
}
```

## Using Templates with Decorators

Templates can be combined with decorators:

```typespec
@doc("A container for {name} objects")
model Container<T, name extends string> {
  values: T[];
}

model UserContainer is Container<User, "user">;
```

## Advanced Template Patterns

### Template Pattern: Resource Operations

Create consistent operation patterns for different resources:

```typespec
interface ResourceOperations<T, IdType = string> {
  get(id: IdType): T;
  list(): T[];
  create(resource: T): T;
  update(id: IdType, resource: T): T;
  delete(id: IdType): void;
}

alias UserOperations is ResourceOperations<User>;
alias ProductOperations is ResourceOperations<Product, int32>;
```

### Template Pattern: Versioned Models

Create versioned variants of models:

```typespec
import "@typespec/versioning";

model VersionedModel<T, V extends Version> {
  @version(V)
  ...T;
}

model UserV1 {
  id: string;
  name: string;
}

model UserV2 extends UserV1 {
  email: string;
}

alias UserV1Model is VersionedModel<UserV1, "1.0">;
alias UserV2Model is VersionedModel<UserV2, "2.0">;
```

### Template Pattern: Wrappers

Create consistent wrapper structures:

```typespec
model WithMetadata<T> {
  data: T;
  created: utcDateTime;
  modified: utcDateTime;
  etag: string;
}

model UserWithMetadata is WithMetadata<User>;
```

## Best Practices for Templates

When using templates in TypeSpec, follow these best practices:

1. **Use descriptive parameter names**: Choose clear names that indicate the purpose of the parameter (e.g., `T` for generic types, `IdType` for ID-related types).

2. **Add constraints when possible**: Use constraints to ensure template parameters meet requirements and to provide better documentation.

3. **Provide defaults when appropriate**: Default parameters make templates easier to use for common cases.

4. **Document templates thoroughly**: Use JSDoc comments to describe the purpose and parameters of templated elements.

5. **Create reusable patterns**: Use templates to create consistent patterns across your API.

6. **Don't overuse templates**: Use templates when they provide real value in terms of code reuse or type safety.

7. **Consider readability**: Complex nested templates can be hard to understand. Break them down or create intermediate aliases.

## Common Template Pitfalls

### Circular References

Avoid circular references in template definitions:

```typespec
// Problematic: Circular reference
model A<T> {
  value: T;
  next: A<T>; // This creates an infinite recursion
}

// Better approach
model A<T> {
  value: T;
  next: A<T> | null; // Add a termination condition
}
```

### Over-Parameterization

Avoid using too many template parameters:

```typespec
// Too many parameters
model ComplexModel<
  T,
  U,
  V,
  W,
  X,
  Y,
  Z
  // properties
> {}

// Better approach: Group related parameters
model ComplexModel<Data, Config, Options> {
  data: Data;
  config: Config;
  options: Options;
}
```

## Summary

Templates in TypeSpec provide a powerful mechanism for creating reusable, generic patterns. By using templates effectively, you can reduce duplication, increase consistency, and create more flexible and maintainable API definitions.

In the next section, we'll explore enums in TypeSpec, which allow you to define a set of named constant values.
