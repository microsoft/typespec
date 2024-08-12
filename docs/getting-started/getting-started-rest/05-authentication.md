---
title: Authentication
---

# Adding Authentication to Your REST API

## Introduction

In this section, we'll focus on adding [authentication](../../libraries/http/authentication) to your REST API. We'll introduce the `@useAuth` decorator, show how to enforce authentication on specific operations, and provide an example using Bearer authentication.

## Introduction to the `@useAuth` Decorator

The [@useAuth](../../libraries/http/reference/decorators#@TypeSpec.Http.useAuth) decorator is used to enforce authentication on specific operations in your REST API. This decorator allows you to specify the authentication mechanism that should be used for the operation. The TypeSpec HTTP library provides support for several authentication models, including `BearerAuth` for Bearer authentication.

Bearer authentication uses tokens for access control. The server generates a token upon login, and the client includes it in the Authorization header for protected resource requests. The server validates the token to grant access to the resource.

### Example: Enforcing Authentication on Specific Operations

Let's update our existing operations to enforce authentication using the `@useAuth` decorator. We'll add authentication to the operations that modify pet data: creating, updating, and deleting pets. We'll also add a new error model for unauthorized access.

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
    @statusCode statusCode: 200;
    @body pets: Pet[];
  };

  @get
  op getPet(@path petId: int32, ...CommonParameters): {
    @statusCode statusCode: 200;
    @body pet: Pet;
  } | {
    @statusCode statusCode: 404;
    @body error: NotFoundError;
  };

  @post
  // highlight-next-line
  @useAuth(BearerAuth)
  op createPet(@body pet: Pet, ...CommonParameters):
    | {
        @statusCode statusCode: 201;
        @body newPet: Pet;
      }
    | {
        @statusCode statusCode: 202;
        @body acceptedPet: Pet;
      }
    | {
        @statusCode statusCode: 400;
        @body error: ValidationError;
        // highlight-start
      }
    | {
        @statusCode statusCode: 401;
        @body error: UnauthorizedError;
        // highlight-end
      };

  @put
  // highlight-next-line
  @useAuth(BearerAuth)
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
        // highlight-start
        @statusCode statusCode: 401;

        @body error: UnauthorizedError;
        // highlight-end
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
  @useAuth(BearerAuth)
  op deletePet(@path petId: int32, ...CommonParameters): {
    @statusCode statusCode: 204;
    // highlight-start
  } | {
    @statusCode statusCode: 401;
    @body error: UnauthorizedError;
    // highlight-end
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

// highlight-start
@error
model UnauthorizedError {
  code: "UNAUTHORIZED";
  message: string;
}
// highlight-end

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
- A new error model, `UnauthorizedError`, is defined to handle unauthorized access errors.
- The `UnauthorizedError` model is used in the `createPet`, `updatePet`, and `deletePet` operations to indicate unauthorized access.

### Example: OpenAPI Specification with Authentication

Let's take a closer look at how the `@useAuth` decorator affects the generated OpenAPI specification for the `deletePet` operation.

```yaml
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
        - $ref: "#/components/parameters/CommonParameters.requestID"
        - $ref: "#/components/parameters/CommonParameters.locale"
        - $ref: "#/components/parameters/CommonParameters.clientVersion"
      // highlight-start
      security:
        - BearerAuth: []
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
  // highlight-start
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
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

### Explanation

- **Security Section**: The `security` section in the `deletePet` operation specifies that Bearer authentication is required. This is indicated by the `BearerAuth` security scheme.
- **Security Schemes**: The `components` section includes a `securitySchemes` definition for `BearerAuth`, specifying that it uses the HTTP bearer authentication scheme.

### Benefits

1. **Security**: Ensures that only authorized clients can perform certain actions by enforcing authentication on specific operations.
2. **Consistency**: The use of common parameters and authentication mechanisms is consistently applied across relevant operations.
3. **Clarity**: The generated OpenAPI specification clearly shows which operations require authentication and which parameters are needed, improving the documentation and usability of the API.

## Conclusion

In this section, we focused on adding authentication to your REST API using TypeSpec. By using the `@useAuth` decorator, we can enforce authentication on specific operations, ensuring that only authorized clients can perform certain actions.

In the next section, we'll dive into versioning your REST API. Versioning allows you to introduce new features and improvements while maintaining backward compatibility for existing clients.
