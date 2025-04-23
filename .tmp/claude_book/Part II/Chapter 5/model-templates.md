# Model Templates

TypeSpec's model templates provide a powerful way to create reusable model patterns with customizable types. Templates enable you to define a model structure once and reuse it with different types, promoting code reuse and consistency.

## Basic Model Templates

To create a model template, use angle brackets (`<>`) to specify template parameters:

```typespec
model Paginated<T> {
  items: T[];
  totalCount: int32;
  pageSize: int32;
  pageNumber: int32;
}
```

In this example, `Paginated<T>` is a template model where `T` is a template parameter that can be replaced with any type.

## Using Model Templates

You can use model templates by providing concrete types for the template parameters:

```typespec
model User {
  id: string;
  name: string;
  email: string;
}

model Product {
  id: string;
  name: string;
  price: float64;
}

// Using the template with different types
model UserList is Paginated<User>;
model ProductList is Paginated<Product>;
```

Here, `UserList` will have the structure:

```typespec
model UserList {
  items: User[];
  totalCount: int32;
  pageSize: int32;
  pageNumber: int32;
}
```

And `ProductList` will have:

```typespec
model ProductList {
  items: Product[];
  totalCount: int32;
  pageSize: int32;
  pageNumber: int32;
}
```

## Multiple Template Parameters

Templates can have multiple parameters:

```typespec
model KeyValuePair<K, V> {
  key: K;
  value: V;
}

model StringToInt is KeyValuePair<string, int32>;
model UserToRole is KeyValuePair<User, string>;
```

## Template Constraints

You can constrain template parameters to ensure they have specific characteristics:

```typespec
model Repository<T extends { id: string }> {
  find(id: string): T;
  save(item: T): T;
  delete(id: string): void;
}
```

Here, the `T` parameter must be a type that has an `id` property of type `string`.

## Default Template Parameters

Templates can provide default types for parameters:

```typespec
model Optional<T, DefaultType = null> {
  value?: T;
  hasValue: boolean;
  defaultValue: DefaultType;
}

model OptionalString is Optional<string>;
model OptionalStringWithDefault is Optional<string, string>;
```

In `OptionalString`, `DefaultType` will be `null`, while in `OptionalStringWithDefault`, it will be `string`.

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

### Wrappers

```typespec
model Envelope<T> {
  data: T;
  metadata: {
    timestamp: utcDateTime;
    requestId: string;
  };
}

model UserEnvelope is Envelope<User>;
```

### Results with Error Handling

```typespec
model Result<T, E = Error> {
  isSuccess: boolean;
  value?: T;
  error?: E;
}

model UserResult is Result<User>;
model OperationResult is Result<void, ApiError>;
```

### Versioned Entities

```typespec
model Versioned<T> {
  ...T;
  version: int32;
  lastModified: utcDateTime;
}

model VersionedUser is Versioned<User>;
```

## TypeSpec Built-in Templates

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
model PublicUser is OmitProperties<User, "email">;
```

### Lifecycle Templates

```typespec
model Product {
  @visibility(Lifecycle.Read)
  id: string;

  name: string;
  description: string;

  @visibility(Lifecycle.Create, Lifecycle.Update)
  categoryId: string;
}

// Only properties visible during Create operations
model CreateProduct is Create<Product>;

// Only properties visible during Update operations
model UpdateProduct is Update<Product>;

// Only properties visible during Read operations
model ReadProduct is Read<Product>;
```

## Friendly Names for Template Instances

You can provide custom naming patterns for template instances using the `@friendlyName` decorator:

```typespec
@friendlyName("{name}Collection")
model Collection<T> {
  items: T[];
  count: int32;
}

// This will be named "UserCollection" instead of "Collection_User"
model UserColl is Collection<User>;
```

## Combining Templates

Templates can be combined and nested:

```typespec
model Paginated<T> {
  items: T[];
  pageSize: int32;
  pageNumber: int32;
}

model Versioned<T> {
  ...T;
  version: int32;
}

// Combining templates
model VersionedPaginatedUsers is Versioned<Paginated<User>>;
```

## Best Practices

1. **Design for reusability**: Create templates that solve general problems, not specific ones.

2. **Document parameters clearly**: Use `@doc` to describe what each template parameter represents.

3. **Use constraints appropriately**: Add constraints to prevent misuse, but don't make them too restrictive.

4. **Consider naming**: Use `@friendlyName` to create more readable names for template instances.

5. **Be consistent**: Use similar template patterns across your API for consistency.

6. **Avoid over-abstraction**: Templates are powerful, but too many nested templates can be hard to understand.

7. **Use built-in templates**: Leverage TypeSpec's built-in templates for common patterns when possible.

By effectively using model templates, you can create more maintainable, reusable, and consistent API definitions with less duplication and clearer structure.
