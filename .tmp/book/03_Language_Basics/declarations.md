# Declarations

In TypeSpec, declarations are essential for defining the various components of your API, including models, operations, and interfaces. Each declaration must adhere to specific rules to ensure clarity and avoid conflicts.

## Unique Naming Requirements

- Names of declarations must be unique across different types within the same scope. For example, the following is not permissible:

```typespec
model Dog {}
namespace Dog {

}
```

In this case, both the model and the namespace cannot share the same name, as it would create ambiguity in the code.

## Declaration Types

TypeSpec supports several types of declarations, including:

- **Models**: Used to define the structure of data.
- **Operations**: Define service endpoints and their behavior.
- **Interfaces**: Group related operations and facilitate reuse.

### Example of a Model Declaration

Here’s how to declare a simple model in TypeSpec:

```typespec
model Pet {
  name: string;
  age: uint8;
}
```

In this example, the `Pet` model has two properties: `name` and `age`, each with their respective types.

### Example of an Operation Declaration

Operations are declared using the `op` keyword. Here’s an example:

```typespec
op getPet(name: string): Pet;
```

This operation, `getPet`, takes a `name` parameter of type `string` and returns a `Pet` model.

### Example of an Interface Declaration

Interfaces can be declared to group related operations:

```typespec
interface PetStore {
  getPet(name: string): Pet;
  addPet(pet: Pet): void;
}
```

In this example, the `PetStore` interface defines two operations related to pet management.

By following these guidelines for declarations, you can create clear and maintainable TypeSpec definitions that enhance the readability and usability of your API.
