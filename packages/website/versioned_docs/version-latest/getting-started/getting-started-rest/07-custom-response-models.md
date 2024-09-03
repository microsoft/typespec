---
title: Custom Response Models
---

# Custom Response Models

## Introduction

In this section, we'll focus on creating custom response models. We'll define custom response models, extend base response models, and demonstrate how to use them in your API operations. We'll also incorporate existing response models from the TypeSpec HTTP library.

## Introduction to Custom Response Models

Custom response models allow you to define structured responses for your API operations. They help ensure consistency and clarity in your API responses. TypeSpec defines response models for common HTTP responses in the [HTTP library](https://typespec.io/docs/libraries/http/reference), which we can incorporate into our custom response models.

### Benefits of Using Custom Response Models

- **Reducing Duplication**: By defining common response structures once, you can reuse them across multiple operations.
- **Improving Readability**: Custom response models make your API definitions clearer and easier to understand.
- **Minimizing Errors**: Consistent response models help reduce the likelihood of errors in your API responses.

## Defining Custom Response Models

Let's start by defining some basic custom response models. We'll incorporate existing response models from the TypeSpec HTTP library.

### Example: Defining Basic Custom Response Models

```typespec
import "@typespec/http";
import "@typespec/versioning";

using TypeSpec.Http;
using TypeSpec.Versioning;

model PetListResponse {
  ...OkResponse;
  ...Body<Pet[]>;
}

model PetResponse {
  ...OkResponse;
  ...Body<Pet>;
}

model PetCreatedResponse {
  ...CreatedResponse;
  ...Body<Pet>;
}

model PetErrorResponse {
  ...BadRequestResponse;
  ...Body<ValidationError>;
}
```

In this example:

- `PetListResponse` extends `OkResponse` and includes a body with an array of `Pet` objects.
- `PetResponse` extends `OkResponse` and includes a body with a single `Pet` object.
- `PetCreatedResponse` extends `CreatedResponse` and includes a body with a newly created `Pet` object.
- `PetErrorResponse` extends `BadRequestResponse` and includes a body with a `ValidationError` object.

## Extending Base Response Models

We can extend base response models to create more specific responses for different scenarios.

### Example: Extending Base Response Models

```typespec
model PetNotFoundResponse {
  ...NotFoundResponse;
  ...Body<NotFoundError>;
}

model PetUnauthorizedResponse {
  ...UnauthorizedResponse;
  ...Body<APIError>;
}

model PetSuccessResponse {
  ...OkResponse;
  ...Body<string>;
}
```

In this example:

- `PetNotFoundResponse` extends `NotFoundResponse` and includes a body with a `NotFoundError` object.
- `PetUnauthorizedResponse` extends `UnauthorizedResponse` and includes a body with an `APIError` object.
- `PetSuccessResponse` extends `OkResponse` and includes a body with a success message.

## Using Custom Response Models in Operations

Now that we have defined our custom response models, let's use them in our API operations.

### Example: Applying Custom Response Models to Operations

```tsp tryit="{"emit": ["@typespec/openapi3"]}"
import "@typespec/http";
import "@typespec/versioning";

using TypeSpec.Http;
using TypeSpec.Versioning;

@service({
  title: "Pet Store",
})
@server("https://example.com", "Single server endpoint")
@versioned(Versions)
namespace PetStore;

enum Versions {
  v1: "1.0",
  v2: "2.0",
}

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

@added(Versions.v2)
model Toy {
  id: int32;
  name: string;
}

model CommonParameters {
  @header
  requestID: string;

  @query
  locale?: string;

  @header
  clientVersion?: string;
}

model PetListResponse {
  ...OkResponse;
  ...Body<Pet[]>;
}

model PetResponse {
  ...OkResponse;
  ...Body<Pet>;
}

model PetCreatedResponse {
  ...CreatedResponse;
  ...Body<Pet>;
}

model PetErrorResponse {
  ...BadRequestResponse;
  ...Body<ValidationError>;
}

model PetNotFoundResponse {
  ...NotFoundResponse;
  ...Body<NotFoundError>;
}

model PetUnauthorizedResponse {
  ...UnauthorizedResponse;
  ...Body<ValidationError>;
}

model PetSuccessResponse {
  ...OkResponse;
  ...Body<string>;
}

@route("/pets")
namespace Pets {
  @get
  op listPets(...CommonParameters): PetListResponse | BadRequestResponse;

  @get
  op getPet(
    @path petId: int32,
    @header ifMatch?: string,
  ): PetResponse | PetNotFoundResponse | BadRequestResponse;

  @useAuth(BearerAuth)
  @post
  op createPet(@body pet: Pet): PetCreatedResponse | PetErrorResponse;

  @useAuth(BearerAuth)
  @put
  op updatePet(@path petId: int32, @body pet: Pet):
    | PetResponse
    | PetNotFoundResponse
    | PetUnauthorizedResponse
    | InternalServerErrorResponse;

  @useAuth(BearerAuth)
  @delete
  op deletePet(
    @path petId: int32,
  ): PetNotFoundResponse | PetSuccessResponse | PetUnauthorizedResponse;

  @route("{petId}/toys")
  namespace Toys {
    @added(Versions.v2)
    @get
    op listToys(@path petId: int32, ...CommonParameters): {
      @body toys: Toy[];
    };

    @added(Versions.v2)
    @post
    @useAuth(BearerAuth)
    op createToy(@path petId: int32, @body toy: Toy, ...CommonParameters): {
      @statusCode statusCode: 201;
      @body newToy: Toy;
    };

    @added(Versions.v2)
    @put
    @useAuth(BearerAuth)
    op updateToy(@path petId: int32, @path toyId: int32, @body toy: Toy, ...CommonParameters): {
      @body updatedToy: Toy;
    };

    @added(Versions.v2)
    @delete
    @useAuth(BearerAuth)
    op deleteToy(@path petId: int32, @path toyId: int32, ...CommonParameters): {
      @statusCode statusCode: 204;
    };
  }
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

- The `listPets` operation uses the `PetListResponse` custom response model.
- The `getPet` operation uses the `PetResponse`, `PetNotFoundResponse`, and `BadRequestResponse` custom response models.
- The `createPet` operation uses the `PetCreatedResponse` and `PetErrorResponse` custom response models.
- The `updatePet` operation uses the `PetResponse`, `PetNotFoundResponse`, `PetUnauthorizedResponse`, and `InternalServerErrorResponse` custom response models.
- The `deletePet` operation uses the `PetNotFoundResponse`, `PetSuccessResponse`, and `PetUnauthorizedResponse` custom response models.

Note that we could also define custom response models for the `Toys` operations, similar to the `Pets` operations. But for brevity, we're omitting them in this example.

## Conclusion

In this section, we focused on creating custom response models in your REST API. By defining and using custom response models, we can reduce duplication, improve readability, and minimize errors in our API responses. We also incorporated existing response models from the TypeSpec HTTP library to ensure consistency and clarity.
