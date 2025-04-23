# Namespaces

Namespaces in TypeSpec provide a way to organize and group related types, operations, and interfaces. They help prevent name conflicts and create a logical structure for your API definitions, making them more maintainable and easier to navigate.

## Basic Namespace Syntax

Namespaces are declared using the `namespace` keyword, followed by the namespace name and a block containing the namespace members:

```typespec
namespace PetStore {
  model Pet {
    id: string;
    name: string;
    type: string;
  }

  interface Pets {
    list(): Pet[];
    get(id: string): Pet;
    create(pet: Pet): Pet;
    update(id: string, pet: Pet): Pet;
    delete(id: string): void;
  }
}
```

## Nested Namespaces

Namespaces can be nested to create hierarchical organization:

```typespec
namespace ECommerce {
  namespace Products {
    model Product {
      id: string;
      name: string;
      price: decimal;
      // ...
    }

    interface ProductOperations {
      // ...
    }
  }

  namespace Orders {
    model Order {
      id: string;
      items: OrderItem[];
      // ...
    }

    model OrderItem {
      productId: string;
      quantity: int32;
      // ...
    }

    interface OrderOperations {
      // ...
    }
  }
}
```

You can also use dot notation to define nested namespaces:

```typespec
namespace ECommerce.Products {
  model Product {
    // ...
  }
}

namespace ECommerce.Orders {
  model Order {
    // ...
  }
}
```

## Referencing Types Across Namespaces

To reference types from another namespace, use the fully qualified name:

```typespec
namespace ECommerce.Products {
  model Product {
    id: string;
    name: string;
    price: decimal;
  }
}

namespace ECommerce.Orders {
  model OrderItem {
    product: ECommerce.Products.Product;
    quantity: int32;
  }

  model Order {
    id: string;
    items: OrderItem[];
  }
}
```

## Using Directive

The `using` directive allows you to reference types from other namespaces without fully qualifying them:

```typespec
namespace ECommerce.Products {
  model Product {
    id: string;
    name: string;
    price: decimal;
  }
}

namespace ECommerce.Orders {
  using ECommerce.Products;

  model OrderItem {
    product: Product; // No need for ECommerce.Products.Product
    quantity: int32;
  }

  model Order {
    id: string;
    items: OrderItem[];
  }
}
```

## Using Aliases

You can create aliases for namespaces to make references shorter and more readable:

```typespec
using Products = ECommerce.Products;

namespace ECommerce.Orders {
  model OrderItem {
    product: Products.Product; // Shorter than ECommerce.Products.Product
    quantity: int32;
  }
}
```

## Namespace Documentation

Like other TypeSpec elements, namespaces can be documented with the `@doc` decorator:

```typespec
@doc("API for managing a pet store")
namespace PetStore {
  @doc("Represents a pet in the store")
  model Pet {
    // ...
  }

  @doc("Operations for managing pets")
  interface Pets {
    // ...
  }
}
```

## Namespace with Service Metadata

Namespaces can be decorated with service metadata using the `@service` decorator:

```typespec
@service({
  title: "Pet Store API",
  version: "1.0.0",
})
namespace PetStore {
// ...

}
```

This metadata is often used by emitters for generating service documentation and client libraries.

## Namespace Organization Patterns

There are several common patterns for organizing types within namespaces:

### 1. Resource-Based Organization

Group types based on the resources they represent:

```typespec
namespace PetStore {
  namespace Pets {
    model Pet /* ... */ {}
    interface Operations /* ... */ {}
  }

  namespace Users {
    model User /* ... */ {}
    interface Operations /* ... */ {}
  }

  namespace Orders {
    model Order /* ... */ {}
    interface Operations /* ... */ {}
  }
}
```

### 2. Layer-Based Organization

Group types based on their role in the API:

```typespec
namespace PetStore {
  namespace Models {
    model Pet /* ... */ {}
    model User /* ... */ {}
    model Order /* ... */ {}
  }

  namespace Operations {
    interface Pets /* ... */ {}
    interface Users /* ... */ {}
    interface Orders /* ... */ {}
  }

  namespace Common {
    model Error /* ... */ {}
    model PagedResult<T /* ... */> {}
  }
}
```

### 3. Feature-Based Organization

Group types based on features or capabilities:

```typespec
namespace PetStore {
  namespace Authentication {
    model Credentials /* ... */ {}
    model Token /* ... */ {}
    interface Auth /* ... */ {}
  }

  namespace Inventory {
    model Product /* ... */ {}
    interface Products /* ... */ {}
  }

  namespace Checkout {
    model Cart /* ... */ {}
    model Payment /* ... */ {}
    interface Carts /* ... */ {}
    interface Payments /* ... */ {}
  }
}
```

## Multiple Files and Namespaces

In larger projects, it's common to split namespaces across multiple files:

### pets.tsp

```typespec
namespace PetStore {
  model Pet {
    id: string;
    name: string;
    type: string;
  }

  interface Pets {
    list(): Pet[];
    get(id: string): Pet;
    // ...
  }
}
```

### users.tsp

```typespec
namespace PetStore {
  model User {
    id: string;
    name: string;
    email: string;
  }

  interface Users {
    list(): User[];
    get(id: string): User;
    // ...
  }
}
```

TypeSpec merges these declarations into a single namespace.

## Versioned Namespaces

For versioned APIs, you can include version information in the namespace:

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
    birthDate: string; // Added in v2
  }
}
```

## Import and Export

TypeSpec allows importing types from other files:

```typespec
// common.tsp
namespace Common {
  model Error {
    code: string;
    message: string;
  }

  model PagedResult<T> {
    items: T[];
    nextLink?: string;
  }
}

// pets.tsp
import "./common.tsp";

namespace PetStore {
  using Common;

  model Pet {
    id: string;
    name: string;
  }

  op listPets(): PagedResult<Pet> | Error;
}
```

## Circular Dependencies

TypeSpec supports circular dependencies between namespaces:

```typespec
namespace A {
  model TypeA {
    b?: B.TypeB;
  }
}

namespace B {
  model TypeB {
    a?: A.TypeA;
  }
}
```

## Best Practices

### Naming Conventions

- Use PascalCase for namespace names
- Use singular nouns for resource types
- Use nouns that clearly indicate the domain or purpose

### Organization

- Keep related types together in the same namespace
- Use nested namespaces for logical grouping
- Split large namespaces across multiple files
- Consider future extensibility when designing namespace structure

### Documentation

- Document the purpose of each namespace
- Include version information in namespace documentation
- Document relationships between namespaces

### Usage

- Use the `using` directive to reduce typing and improve readability
- Avoid deeply nested namespaces (more than 3-4 levels)
- Be consistent with namespace organization patterns across projects

By effectively using namespaces, you can create well-organized, maintainable API definitions that clearly communicate the structure and purpose of your API to both developers and tooling.
