# Namespaces

Namespaces in TypeSpec are containers that group related declarations together. They help organize code and prevent naming conflicts, especially in larger API definitions.

## Declaration

Namespaces are declared using the `namespace` keyword followed by the namespace name and a block of code enclosed in curly braces:

```typespec
namespace PetStore {
  model Pet {
    id: string;
    name: string;
    tag?: string;
  }
}
```

Alternatively, you can use the dot notation to create nested namespaces:

```typespec
namespace PetStore.Models {
  model Pet {
    id: string;
    name: string;
    tag?: string;
  }
}
```

## Nesting

Namespaces can be nested to create a hierarchical organization of your API types:

```typespec
namespace PetStore {
  namespace Models {
    model Pet {
      id: string;
      name: string;
      tag?: string;
    }
  }

  namespace Operations {
    op listPets(): Models.Pet[];
    op createPet(pet: Models.Pet): Models.Pet;
  }
}
```

This creates a clear separation between different parts of your API, making it easier to understand and maintain.

## Using Statements

The `using` statement allows you to access types from a namespace without having to fully qualify them each time:

```typespec
namespace PetStore.Models {
  model Pet {
    id: string;
    name: string;
    tag?: string;
  }
}

namespace PetStore.Operations {
  using PetStore.Models;

  op listPets(): Pet[]; // Instead of Models.Pet[]
  op createPet(pet: Pet): Pet;
}
```

You can also use the `using` statement at the top level of your TypeSpec file to make types from a namespace available throughout the file:

```typespec
import "@typespec/http";
using TypeSpec.Http;

namespace PetStore {
  @get
  op listPets(): Pet[];
}
```

## Namespace Visibility

Types declared within a namespace are visible to other declarations within the same namespace and to declarations in nested namespaces. However, to access types from outside the namespace, you need to either:

1. Fully qualify the type name with the namespace
2. Use a `using` statement

## Service Namespaces

A namespace can be marked as a service using the `@service` decorator:

```typespec
@service
namespace PetStore {
// API definitions go here

}
```

The `@service` decorator can also take optional parameters to specify service metadata:

```typespec
@service({
  title: "Pet Store API",
  version: "1.0.0",
})
namespace PetStore {
// API definitions go here

}
```

## Best Practices

- **Use namespaces to organize related types**: Group models, operations, and other types that are logically related.
- **Follow a consistent naming convention**: Use PascalCase for namespace names.
- **Structure namespaces hierarchically**: Use nested namespaces to create a clear organization of your API.
- **Use `using` statements strategically**: Add them when they improve readability without causing naming conflicts.
- **Keep namespace hierarchy shallow**: Avoid deeply nested namespaces, which can make code harder to read and maintain.

By effectively using namespaces, you can create well-organized TypeSpec definitions that are easier to understand and maintain.
