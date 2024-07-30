---
id: 02-operations-responses
title: Operations and Responses
---

# Operations and Responses

## Introduction

In this section, we'll build upon the basics we covered in the previous section and guide you through expanding your REST API using TypeSpec. We'll define more HTTP operations and handle different types of responses.

## Defining More HTTP Operations

Now that we have a basic `GET` operation to list all pets, let's add more operations to our API. We'll add operations for creating, updating, and deleting pets.

### Example: Defining a POST Operation

Let's define a `POST` operation to create a new pet:

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
  };
}

@error
model NotFoundError {
  code: "NOT_FOUND";
  message: string;
}
```

In this example:

- The `createPet` operation is defined using the `@post` decorator.
- It takes a `Pet` object in the request body and returns the created `Pet` object with a status code of 201.

### Example: Defining a PUT Operation

Let's define a `PUT` operation to update an existing pet:

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
  };

  @put
  op updatePet(@path petId: int32, @body pet: Pet): {
    @body updatedPet: Pet;
  } | {
    @body error: NotFoundError;
  };
}

@error
model NotFoundError {
  code: "NOT_FOUND";
  message: string;
}
```

In this example:

- The `updatePet` operation is defined using the `@put` decorator.
- It takes a `petId` as a path parameter and a `Pet` object in the request body, returning the updated `Pet` object or a `NotFoundError`.

### Example: Defining a DELETE Operation

Let's define a `DELETE` operation to delete an existing pet:

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
```

In this example:

- The `deletePet` operation is defined using the `@delete` decorator.
- It takes a `petId` as a path parameter and returns a status code of 204 if the deletion is successful or a `NotFoundError` if the pet is not found.

## Handling Different Types of Responses

In a real-world API, different operations might return different types of responses. Let's see how we can handle various response scenarios in TypeSpec.

### Example: Handling Validation Errors

Let's define a `ValidationError` model and update our `createPet` operation to handle validation errors.

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
```

In this example:

- The `ValidationError` model is defined to represent validation errors.
- The `createPet` operation is updated to handle validation errors by returning a status code of 400 and a `ValidationError` object.

## Conclusion

In this section, we expanded our REST API by defining more HTTP operations, including `POST`, `PUT`, and `DELETE` operations. We also demonstrated how to handle different types of responses, such as validation errors and not found errors.

In the next section, we'll dive deeper into handling errors in your REST API, including defining custom response models for error handling.
