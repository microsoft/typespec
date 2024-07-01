---
id: getting-started-http-04-resources-routes
title: Resources and Routes
---

# Resources and Routes

A resource is a general term for anything that can be identified by a URL and manipulated by HTTP methods. In TypeSpec, the operations for a resource are typically grouped in a namespace. You declare such a namespace by adding the `@route` decorator to provide the path to that resource:

```typespec
@route("/pets")
namespace Pets {

}
```

Namespaces can be nested to encapsulate different levels of information. For example, you can have a `Pets` namespace that contains operations for managing pets, and a `Toys` namespace that contains operations for managing pet toys, all within the `PetStore` namespace.

Let's add a `Pets` namespace within the `Petstore` namespace, and a `Pet` model to represent unique pets:

```typespec
namespace PetStore {
  enum Versions {
    v1: "1.0.0",
    v2: "2.0.0",
  }

  @route("/pets")
  namespace Pets {
    @added(Versions.v1)
    model Pet {
      @minLength(1)
      name: string;

      @minValue(0)
      @maxValue(100)
      age: int32;

      kind: "dog" | "cat" | "fish" | "bird" | "reptile";
    }
  }
}
```

To define operations on this resource, you need to provide the HTTP verbs for the route using `operation` decorators. If an HTTP method decorator is not specified, then the default is `@post` if there is a body and `@get` otherwise. Let's add operations to our `Pets` resource:

```typespec
@route("/pets")
namespace Pets {
  @added(Versions.v1)
  model Pet {
    @minLength(1)
    name: string;

    @minValue(0)
    @maxValue(100)
    age: int32;

    kind: "dog" | "cat" | "fish" | "bird" | "reptile";
  }

  op list(@query skip?: int32, @query top?: int32): {
    @statusCode statusCode: 200;
    @body pets: Pet[];
  };

  op read(@path petId: int32, @header ifMatch?: string): {
    @statusCode statusCode: 200;
    @header eTag: string;
    @body pet: Pet;
  } | {
    @statusCode statusCode: 404;
  };

  @post
  op create(@body pet: Pet): {
    @statusCode statusCode: 201;
  } | {
    @statusCode statusCode: 400;
    @body error: Error;
  };

  @put
  op update(@path petId: int32, @body pet: Pet): {
    @statusCode statusCode: 200;
    @body updatedPet: Pet;
  } | {
    @statusCode statusCode: 404;
  };

  @delete
  op delete(@path petId: int32): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 404;
  };
}
```

### Automatic Route Generation

Automatic route generation in TypeSpec allows you to generate URL paths for your API operations automatically, reducing the need to manually specify routes. This is achieved using the `@autoRoute` decorator.

#### Key Concepts

- **@autoRoute**: Automatically generates routes for operations in an interface.
- **@path**: Marks a parameter as part of the URL path.
- **@segment**: Defines the specific part of the URL path that the parameter belongs to.

### Example: Managing Pet Toys

Let's extend our Pet Store example to include operations for managing pet toys. We'll define a `Toy` model and a `ToyOperations` interface that contains operations for getting and updating toy information. We'll use the `CommonParameters` model to define common path parameters for both pet and toy operations. Additionally, we'll use the `@added` decorator to indicate that these operations are part of version 2 of the service, in order to demonstrate versioning.

#### Step 1: Define Common Parameters

```typescript
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

```typescript
@added(Versions.v2)
model Toy {
  name: string;
}
```

- **Toy**: This model defines the structure of a toy, with a `name` property.

#### Step 3: Define the Error Model

```typescript
@added(Versions.v2)
@error
model Error {
  message: string;
}
```

- **Error**: This model defines the structure of an error response, with a `message` property.

#### Step 4: Define the ToyOperations Interface

```typescript
@autoRoute
interface ToyOperations {
  @added(Versions.v2)
  @get
  getToy(...CommonParameters): Toy | Error;

  @added(Versions.v2)
  @put
  updateToy(...CommonParameters, toy: Toy): Toy | Error;
}
```

#### Resulting Routes

The `@autoRoute` decorator and the `CommonParameters` model will generate the following routes for the operations:

```text
/pets/{petId}/toys/{toyId}
```

### Integrating with the Pet Store Service

Now, let's integrate the toy management operations with our existing Pet Store service definition:

```typescript
import "@typespec/http";
import "@typespec/rest";
import "@typespec/versioning";

using TypeSpec.Http;
using TypeSpec.Rest;
using TypeSpec.Versioning;

/**
 * This is a sample Pet Store server.
 */
@service({
  title: "Pet Store Service"
})
@server("https://example.com", "Single server endpoint")
@versioned(Versions)
namespace PetStore {
  enum Versions {
    v1: "1.0.0",
    v2: "2.0.0",
  }

  @route("/pets")
  namespace Pets {
    @added(Versions.v1)
    op list(@query skip?: int32, @query top?: int32): {
      @statusCode statusCode: 200;
      @body pets: Pet[];
    };

    op read(@path petId: int32, @header ifMatch?: string): {
      @statusCode statusCode: 200;
      @header eTag: string;
      @body pet: Pet;
    } | {
      @statusCode statusCode: 404;
    };

    @post
    op create(@body pet: Pet): {
      @statusCode statusCode: 201;
    } | {
      @statusCode statusCode: 400;
      @body error: Error;
    };

    @put
    op update(@path petId: int32, @body pet: Pet): {
      @statusCode statusCode: 200;
      @body updatedPet: Pet;
    } | {
      @statusCode statusCode: 404;
    };

    @delete
    op delete(@path petId: int32): {
      @statusCode statusCode: 204;
    } | {
      @statusCode statusCode: 404;
    };
  }

  model Pet {
    @minLength(1)
    name: string;

    @minValue(0)
    @maxValue(100)
    age: int32;

    kind: "dog" | "cat" | "fish";
  }

  model CommonParameters {
    @path
    @segment("pets")
    petId: int32;

    @added(Versions.v2)
    @path
    @segment("toys")
    toyId: int32;
  }

  @added(Versions.v2)
  model Toy {
    name: string;
  }

  @error
  model Error {
    message: string;
  }

  @autoRoute
  interface ToyOperations {
    @added(Versions.v2)
    @get
    getToy(...CommonParameters): Toy | Error;

    @added(Versions.v2)
    @put
    updateToy(...CommonParameters, toy: Toy): Toy | Error;
  }
}
```

---

[Previous: Versioning](./getting-started-http-03-versioning.md) | [Next: Path and Query Parameters](./getting-started-http-05-path-query-parameters.md)
