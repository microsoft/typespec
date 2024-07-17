---
title: Complete Example
---

# Complete Example

In this tutorial, we have covered the basics of creating a REST API definition using TypeSpec. We started by setting up a new TypeSpec project and then defined a Pet Store service with various operations. We explored how to use decorators to define routes, handle path and query parameters, manage headers, and specify request and response bodies. We also looked at how to automatically generate routes, define status codes, handle errors, and manage versioning.

By following these steps, you should now have a good understanding of how to use TypeSpec to define and manage your HTTP APIs. For more advanced features and detailed documentation, refer to the official TypeSpec documentation and community resources.

Here's the complete Pet Store service definition written in TypeSpec:

```tsp tryit="{"emit": ["@typespec/openapi3"]}"
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
  title: "Pet Store Service",
})
@server("https://example.com", "Single server endpoint")
@versioned(Versions)
namespace PetStore;
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

  op list(@header Authorization: string, @query skip?: int32, @query top?: int32): {
    @statusCode statusCode: 200;
    @body pets: Pet[];
  };

  op read(@header Authorization: string, @path petId: int32, @header ifMatch?: string): {
    @statusCode statusCode: 200;
    @header eTag: string;
    @body pet: Pet;
  } | {
    @statusCode statusCode: 404;
    @body error: NotFoundError;
  };

  @post
  op create(@header Authorization: string, @body pet: Pet): {
    @statusCode statusCode: 201;
    @header contentType: "application/json";
    @body message: string;
  } | {
    @statusCode statusCode: 400;
    @body error: ValidationError;
  } | {
    @statusCode statusCode: 500;
    @body error: InternalServerError;
  };

  @put
  op update(@header Authorization: string, @path petId: int32, @body pet: Pet):
    | {
        @statusCode statusCode: 200;
        @header contentType: "application/json";
        @body updatedPet: Pet;
      }
    | {
        @statusCode statusCode: 404;
        @body error: NotFoundError;
      }
    | {
        @statusCode statusCode: 400;
        @body error: ValidationError;
      }
    | {
        @statusCode statusCode: 500;
        @body error: InternalServerError;
      };

  @delete
  op delete(@header Authorization: string, @path petId: int32): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 404;
    @body error: NotFoundError;
  } | {
    @statusCode statusCode: 500;
    @body error: InternalServerError;
  };

  // Search operation combining path and query parameters
  op search(
    @header Authorization: string,
    @path type: string,
    @query skip?: int32,
    @query top?: int32,
  ): {
    @statusCode statusCode: 200;
    @body pets: Pet[];
  };
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
model ValidationError {
  code: "VALIDATION_ERROR";
  message: string;
  details: string[];
}

@error
model NotFoundError {
  code: "NOT_FOUND";
  message: string;
}

@error
model InternalServerError {
  code: "INTERNAL_SERVER_ERROR";
  message: string;
}

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

Running `tsp compile .` will generate two versions of the OpenAPI description for this service in your `tsp-output` folder, one for each version defined in the `Versions` enum.

```
tsp-output/
┗ @typespec/
  ┗ openapi3/
┃   ┣ openapi.1.0.0.yaml
┃   ┗ openapi.2.0.0.yaml
```
