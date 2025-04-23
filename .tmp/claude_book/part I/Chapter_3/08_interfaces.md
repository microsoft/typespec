# 8. Interfaces

Interfaces in TypeSpec provide a powerful mechanism for grouping related operations and defining consistent API patterns. They help organize your API's functionality into logical collections and enable code reuse through inheritance and composition. This section explores how to declare and use interfaces in TypeSpec.

## Understanding Interfaces

An interface in TypeSpec defines a contract that specifies a set of operations that belong together. Unlike models which focus on data structure, interfaces focus on behavior and functionality.

## Declaring Basic Interfaces

The basic syntax for declaring an interface is:

```typespec
interface InterfaceName {
  operation1(param1: Type1): ReturnType1;
  operation2(param2: Type2): ReturnType2;
  // more operations...
}
```

For example, a simple user management interface might look like this:

```typespec
interface Users {
  get(id: string): User;
  create(user: UserCreateRequest): User;
  update(id: string, user: UserUpdateRequest): User;
  delete(id: string): void;
}
```

## Interface Operations

Operations within an interface follow the same syntax as standalone operations, but they are grouped together under the interface's namespace.

### Shorthand Operation Syntax

TypeSpec allows for a shorthand syntax when declaring operations within interfaces:

```typespec
interface Products {
  list(): Product[];
  get(id: string): Product;
}
```

This is equivalent to:

```typespec
interface Products {
  operation list(): Product[];
  operation get(id: string): Product;
}
```

### Operation Modifiers

Operations within interfaces can use various modifiers:

#### Optional Operations

You can mark operations as optional using the `?` modifier:

```typespec
interface ConfigurationService {
  getConfig(): Config;
  updateConfig(config: Config): void;
  resetConfig?(): void;  // Optional operation
}
```

## Interface Composition

TypeSpec supports various mechanisms for interface composition, allowing you to create complex interfaces from simpler ones.

### Interface Inheritance

Interfaces can extend other interfaces using the `extends` keyword:

```typespec
interface ReadOnlyResource {
  get(id: string): Resource;
  list(): Resource[];
}

interface WritableResource extends ReadOnlyResource {
  create(resource: ResourceCreateRequest): Resource;
  update(id: string, resource: ResourceUpdateRequest): Resource;
  delete(id: string): void;
}
```

The `WritableResource` interface inherits all operations from `ReadOnlyResource` and adds its own operations.

### Multiple Inheritance

Interfaces can extend multiple interfaces:

```typespec
interface Taggable {
  addTag(id: string, tag: string): void;
  removeTag(id: string, tag: string): void;
}

interface FullResource extends WritableResource, Taggable {
  // Additional operations specific to FullResource
  clone(id: string): Resource;
}
```

### Interface Spread

You can use the spread operator (`...`) to include all operations from another interface:

```typespec
interface BasicOperations {
  get(id: string): Resource;
  list(): Resource[];
}

interface ExtendedOperations {
  ...BasicOperations;
  create(resource: ResourceCreateRequest): Resource;
}
```

## Interface Templates

Interfaces can be templated, allowing them to work with different types while maintaining a consistent structure.

### Basic Interface Templates

Here's an example of a templated interface:

```typespec
interface ResourceOperations<T> {
  get(id: string): T;
  list(): T[];
  create(item: T): T;
  update(id: string, item: T): T;
  delete(id: string): void;
}
```

This interface can be used with different resource types:

```typespec
alias UserOperations is ResourceOperations<User>;
alias ProductOperations is ResourceOperations<Product>;
```

### Multiple Template Parameters

Interfaces can have multiple template parameters:

```typespec
interface RelationshipOperations<T, U> {
  link(sourceId: string, targetId: string): void;
  getLinked(sourceId: string): U[];
}
```

### Template Constraints

You can constrain the types that can be used with a template:

```typespec
interface EntityOperations<T extends Entity> {
  get(id: string): T;
  update(id: string, entity: T): T;
}
```

## Interface Implementation

TypeSpec allows you to declare that a namespace implements one or more interfaces:

```typespec
interface CrudOperations<T> {
  create(item: T): T;
  read(id: string): T;
  update(id: string, item: T): T;
  delete(id: string): void;
}

namespace UserService implements CrudOperations<User> {
  operation create(item: User): User;
  operation read(id: string): User;
  operation update(id: string, item: User): User;
  operation delete(id: string): void;
}
```

## Interfaces with Decorators

Decorators can be applied to interfaces and their operations to provide additional metadata or behavior.

### HTTP Route Decorators

When using the HTTP library, you can specify the base route for an interface:

```typespec
import "@typespec/http";
using TypeSpec.Http;

@route("/users")
interface Users {
  @get get(id: string): User;
  @post create(@body user: UserCreateRequest): User;
  @put update(id: string, @body user: UserUpdateRequest): User;
  @delete delete(id: string): void;
}
```

### Versioning Decorators

Use versioning decorators to control when interfaces and operations are available:

```typespec
import "@typespec/versioning";
using TypeSpec.Versioning;

@versioned(Versions.v1)
interface BasicUsers {
  get(id: string): User;
}

@versioned(Versions.v2)
interface AdvancedUsers extends BasicUsers {
  getByEmail(email: string): User;
}
```

## Interface Documentation

Add documentation to interfaces using JSDoc-style comments:

```typespec
/**
 * Interface for managing user resources.
 * Provides operations for CRUD operations on users.
 */
interface Users {
  /**
   * Get a user by ID.
   * @param id The unique identifier of the user
   * @returns The user's profile information
   */
  get(id: string): User;

  // Other operations...
}
```

## Interface Visibility

Control the visibility of interfaces using the `@visibility` decorator:

```typespec
@visibility("internal")
interface InternalService {
  internalOperation(): InternalResult;
}
```

## Best Practices for Interfaces

When defining interfaces in TypeSpec, follow these best practices:

1. **Group related operations**: Organize operations into interfaces based on the resources or functionality they relate to.

2. **Keep interfaces focused**: Each interface should have a single responsibility or represent a cohesive set of operations.

3. **Use inheritance for specialization**: Use interface inheritance to create specialized interfaces from more general ones.

4. **Leverage templates**: Use interface templates to create reusable patterns for similar resources.

5. **Be consistent with naming**: Use consistent naming conventions for similar operations across different interfaces.

6. **Document interfaces thoroughly**: Add JSDoc comments to describe the purpose of each interface and its operations.

7. **Consider versioning**: Design interfaces with future versions in mind, using versioning decorators when necessary.

## Interface vs. Namespace

It's important to understand the difference between interfaces and namespaces in TypeSpec:

- **Interfaces** are contracts that define a set of operations and can be composed through inheritance.
- **Namespaces** are organizational units that can contain various TypeSpec declarations, including operations, models, and interfaces.

When deciding which to use:

- Use **interfaces** when you want to define a reusable contract that can be extended or implemented.
- Use **namespaces** when you want to organize your TypeSpec code logically without implying a specific contract.

## Summary

Interfaces in TypeSpec provide a powerful way to organize operations, enable code reuse, and create consistent API patterns. By using interfaces effectively, you can create well-structured APIs that are easier to understand, maintain, and evolve over time.

In the next section, we'll explore templates in TypeSpec, which enable powerful type abstraction and reuse across your API definitions.
