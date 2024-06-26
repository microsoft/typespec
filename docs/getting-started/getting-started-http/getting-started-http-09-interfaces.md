---
id: getting-started-http-09-interfaces
title: Interfaces
---

# Interfaces

In TypeSpec, an interface is a way to define a set of operations that can be grouped together. Interfaces are particularly useful when you want to apply the same set of operations to different resources or when you want to use automatic route generation, covered in the next section.

## Defining an Interface

Let's define an interface for managing pet toys. Since we've decided to extend our pet store service to support toys, we'll need to version the service. We'll add support for toys in version 2 of our pet store service:

```typespec
@added(Versions.v2)
interface ToyOperations {
  @get
  getToy(@path petId: int32, @path toyId: int32): Toy | NotFoundError;

  @put
  updateToy(@path petId: int32, @path toyId: int32, @body toy: Toy): Toy | NotFoundError;
}
```

In this example, the `ToyOperations` interface defines two operations: `getToy` and `updateToy`. The `@added(Versions.v2)` decorator indicates that these operations are part of version 2 of the service.

## Using Interfaces

Interfaces can be used to group operations that apply to different resources. This helps in maintaining a consistent structure and reusing common operations.

We'll use the `ToyOperations` interface to automatically generate routs and operations for managing pet toys in the next section.
