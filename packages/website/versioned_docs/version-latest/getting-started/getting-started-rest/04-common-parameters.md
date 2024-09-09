---
title: Common Parameters
---

# Reusing Common Parameters

## Introduction

In this section, we'll focus on reusing common parameters in your REST API. Common parameters are parameters that are used across multiple operations. By defining these parameters once and reusing them, we can make our API more consistent, easier to read, and easier to maintain.

## Creating a Common Parameters Model

Let's start by defining a model for common parameters. This model will include parameters that will be used across all pet store operations.

### Example: Defining Common Parameters

For the sake of demonstration, we're going to require each API call in our pet store service to include a request ID, a locale, and a client version. Let's define a model for these common parameters, which we'll label `requestID`, `locale`, and `clientVersion`:

```typespec
import "@typespec/http";

using TypeSpec.Http;

@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")
namespace PetStore;
model Pet {
  id: int32;

  @minLength(1)
  name: string;

  @minValue(0)
  @maxValue(100)
  age: int32;

  kind: petType;
}

enum petType {
  dog: "dog",
  cat: "cat",
  fish: "fish",
  bird: "bird",
  reptile: "reptile",
}

model CommonParameters {
  @header
  requestID: string;

  @query
  locale?: string;

  @header
  clientVersion?: string;
}
```

In this example:

- The `@header` decorator is used to indicate that `requestID` and `clientVersion` are header parameters.
- The `@query` decorator is used to indicate that `locale` is a query parameter.

## Reusing Common Parameters Across Multiple Operations

Now that we have defined our common parameters model, let's reuse it across multiple operations in our API.

### Example: Reusing Common Parameters in Operations

```tsp tryit="{"emit": ["@typespec/openapi3"]}"
import "@typespec/http";

using TypeSpec.Http;

@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")
namespace PetStore;

model Pet {
  id: int32;

  @minLength(1)
  name: string;

  @minValue(0)
  @maxValue(100)
  age: int32;

  kind: petType;
}

enum petType {
  dog: "dog",
  cat: "cat",
  fish: "fish",
  bird: "bird",
  reptile: "reptile",
}

model CommonParameters {
  @header
  requestID: string;

  @query
  locale?: string;

  @header
  clientVersion?: string;
}

@route("/pets")
namespace Pets {
  @get
  op listPets(...CommonParameters): {
    @body pets: Pet[];
  };

  @get
  op getPet(@path petId: int32, ...CommonParameters): {
    @body pet: Pet;
  } | {
    @body error: NotFoundError;
  };

  @post
  op createPet(@body pet: Pet, ...CommonParameters): {
    @statusCode statusCode: 201;
    @body newPet: Pet;
  } | {
    @statusCode statusCode: 400;
    @body error: ValidationError;
  };

  @put
  op updatePet(@path petId: int32, @body pet: Pet, ...CommonParameters):
    | {
        @body updatedPet: Pet;
      }
    | {
        @body error: NotFoundError;
      }
    | {
        @statusCode statusCode: 400;
        @body error: ValidationError;
      }
    | InternalServerErrorResponse;

  @delete
  op deletePet(@path petId: int32, ...CommonParameters): {
    @statusCode statusCode: 204;
  } | {
    @body error: NotFoundError;
  };
}

@error
model NotFoundError {
  code: "NOT_FOUND";
  message: string;
}

@error
model ValidationError {
  code: "VALIDATION_ERROR";
  message: string;
  details: string[];
}

@error
model InternalServerError {
  code: "INTERNAL_SERVER_ERROR";
  message: string;
}

model InternalServerErrorResponse {
  @statusCode statusCode: 500;
  @body error: InternalServerError;
}
```

In this example:

- The `CommonParameters` model is reused across multiple operations using the [spread operator](../../language-basics/models#spread) `(...)`, which tells the TypeSpec compiler to expand the model definition inline.
- This approach ensures that the common parameters are consistently applied to all relevant operations, making the API more maintainable and reducing redundancy.

## Conclusion

In this section, we focused on reusing common parameters in your REST API using TypeSpec. By defining a common parameters model and reusing it across multiple operations, we can make our API more consistent, easier to read, and easier to maintain.

In the next section, we'll dive into adding authentication to your REST API.
