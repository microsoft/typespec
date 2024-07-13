---
title: Resources and Routes
---

# Automatic Route Generation

Automatic route generation in TypeSpec allows you to generate URL paths for your API operations automatically, reducing the need to manually specify routes. This is achieved using the `@autoRoute` decorator.

### Key Concepts

- **@autoRoute**: Automatically generates routes for operations in an interface.
- **@path**: Marks a parameter as part of the URL path.
- **@segment**: Defines the specific part of the URL path that the parameter belongs to.

### Example: Managing Pet Toys

Let's extend our Pet Store example to include operations for managing pet toys. We'll define a `Toy` model and use the `ToyOperations` interface we previously defined to generate operations for getting and updating toy information. We'll define a `CommonParameters` model to define common path parameters for both pet and toy operations.

Additionally, we'll use the `@added` decorator to indicate that these operations are part of version 2 of the service.

#### Step 1: Define Common Parameters

```typespec
model CommonParameters {
  @path
  @segment("pets")
  petId: int32;

  @added(Versions.v2)
  @path
  @segment("toys")
  toyId: int32;
}
```

- **CommonParameters**: This model defines common path parameters for pets and toys.
  - `petId`: Part of the URL segment `/pets/{petId}`.
  - `toyId`: Part of the URL segment `/toys/{toyId}`.

#### Step 2: Define the Toy Model

```typespec
@added(Versions.v2)
model Toy {
  name: string;
}
```

- **Toy**: This model defines the structure of a toy, with a `name` property.

#### Step 3: Extend the ToyOperations Interface to use Common Parameters

```typespec
@autoRoute
interface ToyOperations {
  @added(Versions.v2)
  @get
  getToy(...CommonParameters): Toy | NotFoundError;

  @added(Versions.v2)
  @put
  updateToy(...CommonParameters, toy: Toy): Toy | NotFoundError;
}
```

#### Resulting Routes

The `@autoRoute` decorator and the `CommonParameters` model will generate the following routes for the operations:

```text
/pets/{petId}/toys/{toyId}
```

By using the @autoRoute decorator in TypeSpec, you can significantly simplify the process of defining routes for your API operations. This approach not only reduces the need for manual route specification but also ensures consistency and reduces the likelihood of errors.

Automatic route generation is particularly useful when dealing with complex APIs that have multiple nested resources, as it allows you to maintain a clear and organized structure.
