# 3. Namespaces

Namespaces are a fundamental organizational feature in TypeSpec that help structure your API definitions. This section explores how namespaces work, their benefits, and best practices for using them effectively.

## Understanding Namespaces

A namespace in TypeSpec is a container for related type definitions. Namespaces help you:

1. **Organize related types** - Group logically connected declarations
2. **Avoid naming conflicts** - Isolate declarations in their own scope
3. **Create hierarchical structures** - Model complex domain relationships
4. **Control visibility** - Manage what's exposed to consuming code

## Namespace Declaration

To declare a namespace, use the `namespace` keyword followed by a name and a block of declarations:

```typespec
namespace PetStore {
  model Pet {
    id: string;
    name: string;
    type: string;
  }

  model Owner {
    id: string;
    name: string;
    pets: Pet[];
  }
}
```

This creates a namespace called `PetStore` containing two model declarations: `Pet` and `Owner`.

## Nested Namespaces

TypeSpec supports nested namespaces to create hierarchical structures. You can define namespaces within other namespaces:

```typespec
namespace MyAPI {
  namespace Models {
    model User {
      id: string;
      name: string;
    }
  }

  namespace Operations {
    op getUser(id: string): Models.User;
  }
}
```

Here, `Models` and `Operations` are nested within the `MyAPI` namespace.

Alternatively, you can use dot notation to create nested namespaces:

```typespec
namespace MyAPI.Models {
  model User {
    id: string;
    name: string;
  }
}

namespace MyAPI.Operations {
  op getUser(id: string): Models.User;
}
```

Both approaches result in the same namespace structure, but the dot notation can be more concise for deeply nested namespaces.

## Namespace Visibility and Access

Types declared within a namespace are automatically visible to other declarations in the same namespace. To access types from outside the namespace, you have two options:

### Fully Qualified Names

You can always access a type using its fully qualified name, which includes all namespace segments:

```typespec
namespace Database {
  model Connection {
    url: string;
    username: string;
    password: string;
  }
}

namespace Application {
  model Config {
    dbConnection: Database.Connection;
  }
}
```

In this example, `Application` accesses the `Connection` model from the `Database` namespace using its fully qualified name `Database.Connection`.

### Using Directives

For frequently used namespaces, the `using` directive makes types from that namespace directly accessible without qualification:

```typespec
namespace Database {
  model Connection {
    url: string;
    username: string;
    password: string;
  }
}

namespace Application {
  using Database; // Import all types from Database namespace

  model Config {
    dbConnection: Connection; // No need for Database.Connection
  }
}
```

The `using` directive can be placed at the file level (outside any namespace) or within a namespace, affecting only that namespace's scope.

## Namespace Best Practices

For effective namespace usage in TypeSpec projects, follow these best practices:

### 1. Organize by Domain Concepts

Structure namespaces around domain concepts rather than technical concerns:

```typespec
// Good: Domain-focused organization
namespace PetStore.Pets { ... }
namespace PetStore.Orders { ... }
namespace PetStore.Users { ... }

// Less ideal: Technical organization
namespace PetStore.Models { ... }
namespace PetStore.Operations { ... }
namespace PetStore.Interfaces { ... }
```

Domain-focused organization makes your API more intuitive and easier to navigate.

### 2. Use Consistent Naming Conventions

Adopt consistent naming conventions for namespaces:

- Use PascalCase for namespace names
- Use singular names for concept namespaces
- Be consistent with pluralization

```typespec
// Consistent naming
namespace PetStore.Pet { ... }
namespace PetStore.Order { ... }
namespace PetStore.Customer { ... }
```

### 3. Avoid Deep Nesting

While nesting is powerful, deep namespace hierarchies can become unwieldy:

```typespec
// Avoid excessive nesting
namespace Company.Division.Department.Team.Project.Feature.Subfeature { ... }

// Prefer flatter structures
namespace Company.ProjectFeature { ... }
```

Limit namespace nesting to 2-3 levels for most projects.

### 4. Use Service-Level Namespaces

For multi-service architectures, organize by service first:

```typespec
namespace PetStore.CatalogService { ... }
namespace PetStore.OrderService { ... }
namespace PetStore.UserService { ... }
```

This approach maps cleanly to microservice architectures.

### 5. Create Clear Public APIs

Use namespaces to create a clear boundary between public and internal types:

```typespec
namespace MyAPI {
  // Public types at the root level
  model User { ... }

  // Internal types in a nested namespace
  namespace Internal {
    model UserDetails { ... }
  }
}
```

## Namespace Patterns

Several common patterns emerge when working with namespaces in TypeSpec projects:

### Service Pattern

Place your `@service` decorator at the namespace level to define a service boundary:

```typespec
@service({
  title: "Pet Store API",
  version: "1.0.0",
})
namespace PetStore {
// Service-wide declarations

}
```

### Versioning Pattern

Use namespaces to organize versioned API components:

```typespec
namespace PetStore.v1 {
  model Pet {
    id: string;
    name: string;
  }
}

namespace PetStore.v2 {
  model Pet {
    id: string;
    name: string;
    breed: string; // Added in v2
  }
}
```

### Feature Pattern

Group related models and operations by feature:

```typespec
namespace PetStore {
  namespace Catalog {
    model Pet { ... }
    op listPets(): Pet[];
    op getPet(id: string): Pet;
  }

  namespace Adoption {
    model AdoptionRequest { ... }
    op submitAdoption(request: AdoptionRequest): void;
  }
}
```

## Common Namespace Scenarios

Here are some common namespace scenarios and how to handle them:

### Multi-File Projects

For projects spanning multiple files, maintain consistent namespace structure:

```typespec
// pets.tsp
namespace PetStore {
  model Pet { ... }
}

// orders.tsp
namespace PetStore {
  model Order { ... }
}
```

TypeSpec merges these declarations into a single `PetStore` namespace.

### Shared Types

For types used across multiple namespaces, consider a dedicated "common" namespace:

```typespec
namespace PetStore.Common {
  model Pagination {
    skip: int32;
    top: int32;
  }
}

namespace PetStore.Pets {
  op listPets(params: Common.Pagination): Pet[];
}

namespace PetStore.Orders {
  op listOrders(params: Common.Pagination): Order[];
}
```

### Library Consumption

When consuming TypeSpec libraries, respect their namespace structure:

```typespec
import "@typespec/http";
using TypeSpec.Http; // Use the library's namespace

namespace MyAPI {
  @get op getData(): string; // Use HTTP decorators
}
```

## Namespace Conflicts

When namespaces have conflicting type names, use fully qualified names or aliases:

```typespec
namespace ServiceA {
  model User {
    id: string;
  }
}

namespace ServiceB {
  model User {
    userId: string;
  }
}

namespace Application {
  // Resolve conflicts with qualified names
  model UserMapping {
    serviceAUser: ServiceA.User;
    serviceBUser: ServiceB.User;
  }
}
```

## Advanced Namespace Techniques

### Namespace Aliasing

You can create aliases for namespaces to simplify references to long namespace paths:

```typespec
using CoreModels = MyCompany.Platform.Core.Models;

namespace MyService {
  model Config {
    settings: CoreModels.Settings;  // Instead of MyCompany.Platform.Core.Models.Settings
  }
}
```

### Dynamic Namespace Composition

For complex API structures, you can build namespaces dynamically using templates:

```typespec
@service
namespace MyAPI<TVersion extends string> {
  model ApiVersion {
    version: TVersion;
  }
}

// Create versioned instances
namespace MyAPI<"v1"> {
  // v1-specific declarations
}

namespace MyAPI<"v2"> {
  // v2-specific declarations
}
```

## Example: Complete Namespace Structure

Here's a complete example demonstrating effective namespace organization for a pet store API:

```typespec
import "@typespec/http";
import "@typespec/rest";
using TypeSpec.Http;
using TypeSpec.Rest;

@service({
  title: "Pet Store API",
})
namespace PetStore {
  // Common types used across the API
  namespace Common {
    model ResourceId {
      id: string;
    }

    model Pagination {
      skip: int32 = 0;
      top: int32 = 100;
    }

    model Error {
      code: string;
      message: string;
    }
  }

  // Pet-related types and operations
  namespace Pets {
    model Pet {
      id: string;
      name: string;
      category?: string;
      tags: string[];
    }

    @route("/pets")
    interface PetsResource {
      @get list(params: Common.Pagination): Pet[];
      @get get(@path id: string): Pet;
      @post create(@body pet: Pet): Pet;
      @put update(@path id: string, @body pet: Pet): Pet;
      @delete delete(@path id: string): void;
    }
  }

  // Order-related types and operations
  namespace Orders {
    model Order {
      id: string;
      petId: string;
      quantity: int32;
      status: string;
    }

    @route("/orders")
    interface OrdersResource {
      @get list(params: Common.Pagination): Order[];
      @get get(@path id: string): Order;
      @post place(@body order: Order): Order;
    }
  }

  // User-related types and operations
  namespace Users {
    model User {
      id: string;
      username: string;
      email: string;
    }

    @route("/users")
    interface UsersResource {
      @get list(params: Common.Pagination): User[];
      @get get(@path id: string): User;
      @post create(@body user: User): User;
      @put update(@path id: string, @body user: User): User;
      @delete delete(@path id: string): void;
    }
  }
}
```

In this example:

- The root `PetStore` namespace defines the service boundary
- `Common` contains shared types used across the API
- Feature-specific namespaces (`Pets`, `Orders`, `Users`) contain domain models and operations
- Each feature namespace follows a consistent pattern with models and resources

## Next Steps

Now that you understand how namespaces help organize your TypeSpec code, we'll explore decorators in the next section. Decorators are a powerful feature that allows you to extend TypeSpec with additional metadata and behaviors.
