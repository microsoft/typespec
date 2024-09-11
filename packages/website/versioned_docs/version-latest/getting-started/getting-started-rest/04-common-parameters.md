---
title: Common Parameters
---

# Reusing Common Parameters

## Introduction

In this section, we'll focus on reusing common parameters in your REST API. Common parameters are parameters that are used across multiple operations. By defining these parameters once and reusing them, we can make our API more consistent, easier to read, and easier to maintain.

## Creating a Common Parameters Model

Let's start by defining a model for common parameters. This model will include parameters that will be used across all Pet Store operations.

### Example: Defining Common Parameters

For the sake of demonstration, we're going to require each API call in our Pet Store service to include a request ID, a locale, and a client version. Let's define a model for these common parameters, which we'll label `requestID`, `locale`, and `clientVersion`:

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

// highlight-start
model CommonParameters {
  @header
  requestID: string;

  @query
  locale?: string;

  @header
  clientVersion?: string;
}
// highlight-end
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
  // highlight-next-line
  op listPets(...CommonParameters): {
    @statusCode statusCode: 200;
    @body pets: Pet[];
  };

  @get
  // highlight-next-line
  op getPet(@path petId: int32, ...CommonParameters): {
    @statusCode statusCode: 200;
    @body pet: Pet;
  } | {
    @statusCode statusCode: 404;
    @body error: NotFoundError;
  };

  @post
  // highlight-next-line
  op createPet(@body pet: Pet, ...CommonParameters): {
    @statusCode statusCode: 201;
    @body newPet: Pet;
  } | {
    @statusCode statusCode: 202;
    @body acceptedPet: Pet;
  } | {
    @statusCode statusCode: 400;
    @body error: ValidationError;
  };

  @put
  // highlight-next-line
  op updatePet(@path petId: int32, @body pet: Pet, ...CommonParameters):
    | {
        @statusCode statusCode: 200;
        @body updatedPet: Pet;
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
      };

  @delete
  // highlight-next-line
  op deletePet(@path petId: int32, ...CommonParameters): {
    @statusCode statusCode: 204;
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

- The `CommonParameters` model is reused across multiple operations using the [spread operator](../../language-basics/models#spread) `(...)`, which tells the TypeSpec compiler to expand the model definition inline.
- This approach ensures that the common parameters are consistently applied to all relevant operations, making the API more maintainable and reducing redundancy.

### Example: OpenAPI Specification for Common Parameters

Let's take a closer look at how the common parameters model with the `spread` operator is represented in the generated OpenAPI specification by looking at the `deletePet` operation:

```yaml
#### Generated OpenAPI Specification:

paths:
  /pets/{petId}:
    delete:
      operationId: Pets_deletePet
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: integer
            format: int32
        // highlight-start
        - $ref: "#/components/parameters/CommonParameters.requestID"
        - $ref: "#/components/parameters/CommonParameters.locale"
        - $ref: "#/components/parameters/CommonParameters.clientVersion"
        // highlight-end
      responses:
        "204":
          description: "There is no content to send for this request, but the headers may be useful."
        "404":
          description: "Not Found"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/NotFoundError"
components:
  parameters:
    // highlight-start
    CommonParameters.clientVersion:
      name: client-version
      in: header
      required: false
      schema:
        type: string
    CommonParameters.locale:
      name: locale
      in: query
      required: false
      schema:
        type: string
    CommonParameters.requestID:
      name: request-id
      in: header
      required: true
      schema:
        type: string
    // highlight-end
  schemas:
    NotFoundError:
      type: object
      properties:
        code:
          type: string
          example: "NOT_FOUND"
        message:
          type: string
```

In this example:

- **Parameters Section**: The `deletePet` operation includes the `petId` path parameter and the common parameters (`requestID`, `locale`, and `clientVersion`). The common parameters are referenced using `$ref` to ensure they are consistently defined and reused across multiple operations.
- **Components Section**: The common parameters are defined under the `components` section, ensuring they are reusable and maintainable. Each parameter is specified with its name, location (`in` indicating header or query), whether it is required, and its schema.

### Benefits

1. **Consistency**: Ensures that common parameters are applied consistently across all relevant operations.
2. **Maintainability**: Changes to common parameters need to be made only once in the `CommonParameters` model, reducing redundancy and potential errors.
3. **Clarity**: The generated OpenAPI specification clearly shows which parameters are required for each operation, improving the documentation and usability of the API.

## Conclusion

In this section, we focused on reusing common parameters in your REST API. By defining a common parameters model and reusing it across multiple operations, we can make our API more consistent, easier to read, and easier to maintain.

Next, we'll learn how to add authentication to our REST API.
