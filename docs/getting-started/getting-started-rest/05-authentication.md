---
title: Authentication
---

# Adding Authentication to Your REST API

## Introduction

In this section, we'll focus on adding authentication to your REST API. We'll introduce the `@useAuth` decorator, show how to enforce [authentication](../../libraries/http/authentication) on specific operations, and provide an example using Bearer authentication.

## Introduction to the `@useAuth` Decorator

The [@useAuth](../../libraries/http/reference/decorators#@TypeSpec.Http.useAuth) decorator is used to enforce authentication on specific operations in your REST API. This decorator allows you to specify the authentication mechanism that should be used for the operation. The TypeSpec HTTP library provides support for several authentication models, including `BearerAuth` for Bearer authentication.

### Example: Enforcing Authentication on Specific Operations

Let's update our existing operations to enforce authentication using the `@useAuth` decorator. We'll add authentication to the operations that modify pet data, such as creating, updating, and deleting pets.

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
  @useAuth(BearerAuth)
  op createPet(@body pet: Pet, ...CommonParameters): {
    @statusCode statusCode: 201;
    @body newPet: Pet;
  } | {
    @statusCode statusCode: 400;
    @body error: ValidationError;
  };

  @put
  @useAuth(BearerAuth)
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
  @useAuth(BearerAuth)
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

- The `@useAuth(BearerAuth)` decorator is applied to the `createPet`, `updatePet`, and `deletePet` operations to enforce authentication using the Bearer authentication mechanism.
- Bearer authentication uses tokens for access control. The server generates a token upon login, and the client includes it in the Authorization header for protected resource requests.

## Conclusion

In this section, we focused on adding authentication to your REST API using TypeSpec. By using the `@useAuth` decorator, we can enforce authentication on specific operations, ensuring that only authorized clients can perform certain actions.
