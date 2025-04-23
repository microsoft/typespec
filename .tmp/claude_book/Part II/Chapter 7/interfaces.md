# Interfaces

Interfaces in TypeSpec are used to group related operations together, providing a way to organize your API's functionality into logical units. They help structure your API definition, making it more maintainable and easier to understand.

## Basic Interface Syntax

Interfaces are declared using the `interface` keyword, followed by the interface name and a block of operation declarations:

```typespec
interface Users {
  getUser(id: string): User;
  listUsers(): User[];
  createUser(user: User): User;
  updateUser(id: string, user: User): User;
  deleteUser(id: string): void;
}
```

This example defines an interface named `Users` that contains five operations related to user management.

## Interface Documentation

Like other TypeSpec elements, interfaces can be documented using the `@doc` decorator:

```typespec
@doc("Operations for managing user accounts")
interface Users {
  @doc("Retrieve a user by their ID")
  getUser(id: string): User;

  @doc("List all users")
  listUsers(): User[];

  // ...
}
```

## Interface Organization

Interfaces are typically defined within namespaces and can be used to organize operations in various ways:

### Resource-Based Interfaces

A common approach is to organize interfaces around resources or entities in your domain:

```typespec
namespace PetStore {
  interface Pets {
    get(id: string): Pet;
    list(): Pet[];
    create(pet: Pet): Pet;
    update(id: string, pet: Pet): Pet;
    delete(id: string): void;
  }

  interface Orders {
    get(id: string): Order;
    list(): Order[];
    create(order: Order): Order;
    update(id: string, order: Order): Order;
    delete(id: string): void;
  }
}
```

### Capability-Based Interfaces

Another approach is to organize interfaces around capabilities or features:

```typespec
namespace PaymentSystem {
  interface PaymentProcessing {
    processPayment(payment: Payment): PaymentResult;
    refundPayment(paymentId: string, amount: decimal): RefundResult;
    captureAuthorization(authorizationId: string): CaptureResult;
  }

  interface Reporting {
    getPaymentHistory(from: utcDateTime, to: utcDateTime): PaymentRecord[];
    generateMonthlyStatement(month: int32, year: int32): Statement;
    exportTransactions(criteria: ExportCriteria): ExportResult;
  }
}
```

## Interface Templates

You can create generic interfaces that can be instantiated with different types:

```typespec
interface CrudOperations<T> {
  op get(id: string): T;
  op list(): T[];
  op create(item: T): T;
  op update(id: string, item: T): T;
  op delete(id: string): void;
}

interface Users is CrudOperations<User>;
interface Products is CrudOperations<Product>;
```

This approach promotes consistency across your API by reusing common operation patterns.

## Interface Inheritance

Interfaces can extend other interfaces to inherit their operations:

```typespec
interface ReadOperations<T> {
  get(id: string): T;
  list(): T[];
}

interface WriteOperations<T> {
  create(item: T): T;
  update(id: string, item: T): T;
  delete(id: string): void;
}

interface CrudOperations<T>
  extends ReadOperations<T>,
    WriteOperations<T> {}
    // Inherits all operations from ReadOperations and WriteOperations
```

A derived interface inherits all operations from its base interfaces, allowing for flexible composition of functionality.

## Interface with Decorators

Interfaces and their operations can have decorators to specify additional metadata or behavior:

```typespec
@tag("Users")
interface Users {
  @tag("Read")
  getUser(id: string): User;

  @tag("Read")
  listUsers(): User[];

  @tag("Write")
  createUser(user: User): User;

  @tag("Write")
  updateUser(id: string, user: User): User;

  @tag("Write")
  deleteUser(id: string): void;
}
```

## Nested Interfaces

Interfaces can be nested within namespaces or other interfaces to create a hierarchical organization:

```typespec
namespace ECommerce {
  interface Catalog {
    interface Products {
      op get(id: string): Product;
      op list(): Product[];
      op create(product: Product): Product;
    }

    interface Categories {
      op get(id: string): Category;
      op list(): Category[];
      op getProducts(categoryId: string): Product[];
    }
  }
}
```

## Interfaces vs. Namespaces

While both interfaces and namespaces can contain operations, they serve different purposes:

- **Namespaces** are primarily for organizing code and preventing name collisions.
- **Interfaces** are specifically for grouping related operations into logical units.

A common pattern is to use namespaces for broad organization and interfaces for finer-grained grouping:

```typespec
namespace PaymentService {
  interface Payments /* operations */ {}
  interface Refunds /* operations */ {}
  interface Disputes /* operations */ {}
}
```

## Interfaces and Protocol-Specific Decorators

When combined with protocol-specific libraries like `@typespec/http`, interfaces can be decorated with additional metadata:

```typespec
import "@typespec/http";
using TypeSpec.Http;

@route("/users")
interface Users {
  @get
  getUser(@path id: string): User;

  @get
  listUsers(): User[];

  @post
  createUser(@body user: User): User;

  @put
  updateUser(@path id: string, @body user: User): User;

  @delete
  deleteUser(@path id: string): void;
}
```

## Best Practices

### Interface Design

- **Group related operations**: Put operations that work with the same resource or concept in the same interface.
- **Keep interfaces focused**: Each interface should have a clear, cohesive purpose.
- **Use consistent naming patterns**: Follow consistent naming conventions across interfaces.
- **Consider interface size**: Avoid overly large interfaces; split them into smaller, more focused ones if needed.

### Operation Organization

- **Use templates for common patterns**: Define generic interface templates for reusable operation patterns.
- **Consider visibility**: Group operations by their visibility or access level when appropriate.
- **Align with client usage patterns**: Design interfaces around how clients will use your API.

### Documentation

- **Document interfaces thoroughly**: Explain the purpose and scope of each interface.
- **Document relationships**: If interfaces are related, document how they relate to each other.
- **Include examples**: Provide usage examples for complex interfaces.

### Evolution

- **Plan for versioning**: Consider how interfaces will evolve over time.
- **Use inheritance judiciously**: Interface inheritance can help with reuse but can also create complex hierarchies.
- **Maintain backward compatibility**: When extending interfaces, avoid breaking existing clients.

By effectively using interfaces, you can create well-organized, maintainable API definitions that clearly communicate the structure and capabilities of your API to both developers and tooling.
