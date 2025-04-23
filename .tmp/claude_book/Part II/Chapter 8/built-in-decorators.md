# Built-in Decorators

TypeSpec includes many built-in decorators that are part of the core language. These decorators provide essential functionality for documenting, constraining, and structuring your API definitions without requiring additional libraries.

## Documentation Decorators

### `@doc`

The `@doc` decorator provides detailed documentation for TypeSpec elements:

```typespec
@doc("A user in the system")
model User {
  @doc("The user's unique identifier")
  id: string;

  @doc("The user's email address")
  email: string;
}
```

You can use Markdown formatting in documentation strings:

```typespec
@doc("A **user** in the system.

- Users can have multiple roles
- Users must have a unique email")
model User {
  // ...
}
```

### `@summary`

The `@summary` decorator provides a brief description, typically used alongside `@doc` for more concise summaries:

```typespec
@summary("User entity")
@doc("A user represents an individual who can authenticate and use the system.")
model User {
  // ...
}
```

### `@deprecated`

The `@deprecated` decorator marks an element as deprecated, optionally providing information about alternatives:

```typespec
@deprecated("Use `Customer` instead")
model User {
  // ...
}

@deprecated("Use `email` property instead")
model User {
  username: string;
  email: string;
}
```

### `@example`

The `@example` decorator provides example values for models, properties, or operations:

```typespec
@example({
  id: "123",
  name: "John Doe",
  email: "john@example.com",
})
model User {
  id: string;
  name: string;
  email: string;
}

model Product {
  id: string;

  @example("Widget Pro 3000")
  name: string;

  @example(19.99)
  price: decimal;
}
```

## Validation Decorators

### String Validation

TypeSpec provides several decorators for constraining string values:

```typespec
model StringValidation {
  @minLength(3)
  shortName: string;

  @maxLength(100)
  longDescription: string;

  @minLength(8)
  @maxLength(20)
  password: string;

  @pattern("[A-Z][a-z]{2,}")
  properName: string;

  @format("email")
  email: string;

  @format("uri")
  website: string;

  @format("uuid")
  id: string;
}
```

### Numeric Validation

Decorators for constraining numeric values:

```typespec
model NumericValidation {
  @minValue(0)
  nonNegative: int32;

  @maxValue(100)
  percentage: int32;

  @minValue(18)
  @maxValue(65)
  workingAge: int32;

  @multipleOf(0.5)
  halfStep: decimal;
}
```

### Array Validation

Decorators for constraining array properties:

```typespec
model ArrayValidation {
  @minItems(1)
  nonEmptyTags: string[];

  @maxItems(10)
  limitedChoices: string[];

  @minItems(1)
  @maxItems(5)
  topFavorites: string[];

  @uniqueItems
  noDuplicates: string[];
}
```

## Structural Decorators

### `@key`

The `@key` decorator marks a property as the identifier for instances of a model:

```typespec
model User {
  @key
  id: string;

  name: string;
  email: string;
}
```

You can also specify a name for the key if it differs from the property name:

```typespec
model User {
  @key("userId")
  id: string;

  name: string;
}
```

### `@discriminator`

The `@discriminator` decorator specifies a property that distinguishes between different subtypes in an inheritance hierarchy:

```typespec
@discriminator("kind")
model Pet {
  kind: string;
  name: string;
}

model Dog extends Pet {
  kind: "dog";
  breed: string;
}

model Cat extends Pet {
  kind: "cat";
  color: string;
}
```

### `@discriminated`

Used with union types to indicate they should be discriminated:

```typespec
@discriminated
union Shape {
  circle: Circle,
  square: Square,
  triangle: Triangle,
}
```

### `@visibility`

The `@visibility` decorator controls when properties are visible based on the operation context:

```typespec
model User {
  @visibility(Lifecycle.Read)
  id: string;

  name: string;

  @visibility(Lifecycle.Create, Lifecycle.Update)
  password: string;
}
```

This is often used with lifecycle templates like `Create<T>`, `Read<T>`, and `Update<T>`.

### `@error`

The `@error` decorator marks a model as representing an error response:

```typespec
@error
model NotFoundError {
  code: "NotFound";
  message: string;
}

op getUser(id: string): User | NotFoundError;
```

## Naming and Display Decorators

### `@friendlyName`

The `@friendlyName` decorator provides an alternative name for display purposes:

```typespec
@friendlyName("CustomerInformation")
model Customer {
  id: string;
  name: string;
}
```

For template types, you can use string interpolation:

```typespec
@friendlyName("{name}List")
model List<T> {
  items: T[];
  totalCount: int32;
}
```

### `@encodedName`

The `@encodedName` decorator specifies how a property name should appear in serialized form:

```typespec
model User {
  id: string;

  @encodedName("full-name")
  fullName: string;

  @encodedName("email_address")
  emailAddress: string;
}
```

## Metadata Decorators

### `@tag`

The `@tag` decorator categorizes operations, interfaces, or namespaces:

```typespec
@tag("Users")
interface UserOperations {
  @tag("Read")
  getUser(id: string): User;

  @tag("Write")
  createUser(user: User): User;
}
```

### `@service`

The `@service` decorator marks a namespace as a service definition and provides metadata:

```typespec
@service({
  title: "User Management API",
  version: "1.0.0",
})
namespace UserService {
// Service definitions

}
```

## Debugging Decorators

### `@inspectType`

The `@inspectType` decorator is useful for debugging TypeSpec code:

```typespec
@inspectType
model User {
  id: string;
  name: string;
}

@inspectType("Type info for PagedUsers")
model PagedUsers is PagedResult<User>;
```

When compiling TypeSpec, this will output type information to help diagnose issues.

## Operation-Specific Decorators

### `@returnsDoc`

The `@returnsDoc` decorator documents an operation's return value:

```typespec
@doc("Get a user by ID")
@returnsDoc("The user if found")
op getUser(id: string): User;
```

### `@errorsDoc`

The `@errorsDoc` decorator documents possible error responses:

```typespec
@doc("Create a new user")
@returnsDoc("The created user")
@errorsDoc("Validation errors if the input is invalid")
op createUser(user: User): User | ValidationError;
```

### `@overload`

The `@overload` decorator defines alternative signatures for an operation:

```typespec
op getUser(id: string): User;

@overload
op getUser(email: string, type: "email"): User;
```

## Best Practices for Built-in Decorators

1. **Be consistent**: Apply decorators consistently across similar elements.
2. **Group decorators logically**: Keep related decorators together and in a consistent order.
3. **Document everything**: Use `@doc` liberally to explain the purpose of your types, properties, and operations.
4. **Add constraints**: Use validation decorators to make your API definitions more precise.
5. **Use structural decorators**: Employ decorators like `@key` and `@discriminator` to capture important relationships.
6. **Consider readability**: Choose decorators that make your API more understandable to other developers.
7. **Don't overuse**: Apply decorators when they add value, not just because they exist.

By effectively using TypeSpec's built-in decorators, you can create rich, well-documented, and precisely constrained API definitions that clearly communicate both to humans and tools how your API should behave.
