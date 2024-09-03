---
title: Handling Errors
---

# Handling Errors in Your REST API

## Introduction

In this section, we'll focus on handling errors in your REST API. We've already introduced defining error models in the previous sections, and now we'll expand on that topic. We'll define additional error models, create custom response models for error handling, and demonstrate how to use union types for different response scenarios.

## Defining Error Models

Error models can be used to represent different types of errors that your API might return. Let's start by defining some common error models.

### Example: Defining Common Error Models

We've already defined models to represent validation errors and not-found errors. We'll now add a model for internal server errors:

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
    @body pets: Pet[];
  };

  @get
  op getPet(@path petId: int32): {
    @body pet: Pet;
  } | {
    @body error: NotFoundError;
  };

  @post
  op createPet(@body pet: Pet): {
    @statusCode statusCode: 201;
    @body newPet: Pet;
  } | {
    @statusCode statusCode: 400;
    @body error: ValidationError;
  };

  @put
  op updatePet(@path petId: int32, @body pet: Pet): {
    @body updatedPet: Pet;
  } | {
    @body error: NotFoundError;
  };

  @delete
  op deletePet(@path petId: int32): {
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
```

In this example:

- The `ValidationError`, `NotFoundError`, and `InternalServerError` models are defined to represent different types of errors.
- The `@error` decorator is used to indicate that these models represent error responses.

## Custom Response Models for Error Handling

Sometimes, you may need to create custom response models to handle specific error scenarios. Let's define a custom response model for the `InternalServerError` we just created.

### Example: Defining a Custom Response Model

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
    @body pets: Pet[];
  };

  @get
  op getPet(@path petId: int32): {
    @body pet: Pet;
  } | {
    @body error: NotFoundError;
  };

  @post
  op createPet(@body pet: Pet): {
    @statusCode statusCode: 201;
    @body newPet: Pet;
  } | {
    @statusCode statusCode: 400;
    @body error: ValidationError;
  };

  @put
  op updatePet(@path petId: int32, @body pet: Pet): {
    @body updatedPet: Pet;
  } | {
    @body error: NotFoundError;
  } | InternalServerErrorResponse;

  @delete
  op deletePet(@path petId: int32): {
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

- The `InternalServerErrorResponse` model is defined to represent a custom response for a 500 Internal Server Error.
- The `updatePet` operation is updated to respond with with our custom `InternalServerErrorResponse` in case of an internal server error.

## Union Expressions for Different Response Scenarios

Union expressions are a type of [union](../../language-basics/unions.md) that allows you to define operations that can return different responses based on various scenarios.

We've already seen some examples of this, let's expand on how we can use union types to handle different response scenarios in our operations.

### Example: Using Union Expressions for Responses

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
    @body pets: Pet[];
  };

  @get
  op getPet(@path petId: int32): {
    @body pet: Pet;
  } | {
    @body error: NotFoundError;
  };

  @post
  op createPet(@body pet: Pet): {
    @statusCode statusCode: 201;
    @body newPet: Pet;
  } | {
    @statusCode statusCode: 400;
    @body error: ValidationError;
  };

  @put
  op updatePet(@path petId: int32, @body pet: Pet):
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
  op deletePet(@path petId: int32): {
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

- The `updatePet` operation is updated to handle multiple response scenarios using union expressions.
- It can return an updated `Pet` object, a `NotFoundError`, a `ValidationError`, or an `InternalServerErrorResponse` custom response model.

## Conclusion

In this section, we focused on defining error handling in your REST API. We expanded on the topic of defining error models, created custom response models for error handling, and demonstrated how to use union expressions for different response scenarios.

In the next section, we'll dive into reusing common parameters in your REST API.
