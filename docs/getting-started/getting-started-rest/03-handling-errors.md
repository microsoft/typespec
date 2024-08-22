---
title: Handling Errors
---

# Handling Errors in Your REST API

## Introduction

In this section, we'll focus on handling errors in your REST API. We'll define error models and demonstrate how to use union types for different response scenarios.

## Why Use Error Models?

Using error models instead of raw status codes offers several advantages:

1. **Consistency**: Error models ensure that error responses are consistent across your API. This makes it easier for clients to handle errors predictably.
2. **Clarity**: Error models provide clear, structured information about the error, including error codes, messages, and additional details. This helps developers understand what went wrong and how to fix it.
3. **Extensibility**: Error models can be extended to include additional information, such as error details, validation issues, or links to documentation. This makes it easier to provide comprehensive error information.
4. **Documentation**: Error models improve the generated API documentation by clearly defining the structure of error responses. This helps API consumers understand the possible error responses and how to handle them.
5. **Type Safety**: In strongly-typed languages, using error models can provide type safety, ensuring that error responses conform to the expected structure.

## Defining Error Models

Error models can be used to represent different types of errors that your API might return. Let's start by defining some common error models.

### Example: Defining Common Error Models

We'll define models to represent validation errors, not-found errors, and internal server errors:

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

@route("/pets")
namespace Pets {
  @get
  op listPets(): {
    @statusCode statusCode: 200;
    @body pets: Pet[];
  };

  @get
  op getPet(@path petId: int32): {
    @statusCode statusCode: 200;
    @body pet: Pet;
  } | {
    @statusCode statusCode: 404;

    // highlight-next-line
    @body error: NotFoundError;
  };

  @post
  op createPet(@body pet: Pet): {
    @statusCode statusCode: 201;
    @body newPet: Pet;
  } | {
    @statusCode statusCode: 202;
    @body acceptedPet: Pet;
    // highlight-start
  } | {
    @statusCode statusCode: 400;
    @body error: ValidationError;
  };
  // highlight-end

  @put
  op updatePet(@path petId: int32, @body pet: Pet):
    | {
        @statusCode statusCode: 200;
        @body updatedPet: Pet;
        // highlight-start
      }
    | {
        @statusCode statusCode: 400;
        @body error: ValidationError;
      }
    | {
        @statusCode statusCode: 404;
        @body error: NotFoundError;
      }
    | {
        @statusCode statusCode: 500;
        @body error: InternalServerError;
        // highlight-end
      };

  @delete
  op deletePet(@path petId: int32): {
    @statusCode statusCode: 204;
  };
}

// highlight-start
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
// highlight-end
```

In this example:

- The `NotFoundError`, `ValidationError`, and `InternalServerError` models are defined to represent different types of errors.
- The `@error` decorator is used to indicate that these models represent error responses.
- The Pet Store operations are updated to return the appropriate error models when the service can't perform the requested operation.

## Conclusion

In this section, we focused on defining error handling in your REST API. We introduced error models and demonstrated how to represent different operation response scenarios in TypeSpec.

In the next section, we'll dive into reusing common parameters in your REST API.
