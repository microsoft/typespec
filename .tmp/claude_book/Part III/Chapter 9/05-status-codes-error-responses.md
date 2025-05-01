# Status Codes and Error Responses

HTTP status codes communicate the outcome of API requests, while proper error responses provide details about failures. TypeSpec provides several ways to define status codes and structured error responses to create clear, consistent API contracts.

## Understanding HTTP Status Codes

HTTP status codes are three-digit numbers grouped into five categories:

- **1xx (Informational)**: Request received, continuing process
- **2xx (Success)**: Request successfully received, understood, and accepted
- **3xx (Redirection)**: Further action needed to complete the request
- **4xx (Client Error)**: Request contains bad syntax or cannot be fulfilled
- **5xx (Server Error)**: Server failed to fulfill a valid request

TypeSpec allows you to explicitly define which status codes your API operations return, along with their corresponding response bodies.

## Default Status Codes in TypeSpec

By default, TypeSpec assigns status codes based on the operation and its return type:

- For operations that return a value, the default status is `200 OK`
- For operations that return `void`, the default status is `204 No Content`
- For operations with a decorator like `@post` and a return type, the default is `200 OK`

## Using the `@statusCode` Decorator

The `@statusCode` decorator explicitly sets the HTTP status code for a response:

```typespec
@route("/users")
interface Users {
  @post
  @statusCode(201)
  createUser(@body user: User): User;
}
```

This decorator can be applied to operations or to properties in a response type:

```typespec
@route("/users/{id}")
@get
op getUser(@path id: string): {
  @statusCode(200)
  @body
  user: User;
};
```

## Predefined Response Types

The HTTP library provides predefined response types for common status codes:

```typespec
import "@typespec/http";
using TypeSpec.Http;

@route("/users")
interface Users {
  @post
  createUser(@body user: User): CreatedResponse & {
    @body user: User;
  };

  @delete
  @route("/{id}")
  deleteUser(@path id: string): NoContentResponse;
}
```

Common predefined response types include:

| Response Type          | Status Code | Description                           |
| ---------------------- | ----------- | ------------------------------------- |
| `OkResponse`           | 200         | Request succeeded                     |
| `CreatedResponse`      | 201         | Resource created successfully         |
| `AcceptedResponse`     | 202         | Request accepted for processing       |
| `NoContentResponse`    | 204         | Request succeeded with no content     |
| `MovedResponse`        | 301         | Resource permanently moved            |
| `RedirectResponse`     | 302         | Resource temporarily moved            |
| `BadRequestResponse`   | 400         | Invalid request                       |
| `UnauthorizedResponse` | 401         | Authentication required               |
| `ForbiddenResponse`    | 403         | Permission denied                     |
| `NotFoundResponse`     | 404         | Resource not found                    |
| `ConflictResponse`     | 409         | Request conflicts with resource state |

Using these types ensures consistency across your API's status code usage.

## Multiple Response Types

Operations often need to return different responses based on the scenario. TypeSpec supports this using union types:

```typespec
@route("/users/{id}")
@get
op getUser(@path id: string): {
  @statusCode(200)
  @body
  user: User;
} | {
  @statusCode(404)
  @body
  error: Error;
};
```

This pattern clearly defines all possible responses for an operation, making it easier for clients to handle different outcomes.

## Structured Error Responses

Consistent error response structures help clients understand and handle errors appropriately. TypeSpec makes it easy to define standardized error models:

```typespec
model Error {
  code: string;
  message: string;
  details?: Record<unknown>;
  target?: string;
}

@route("/resources/{id}")
@get
op getResource(@path id: string): {
  @statusCode(200)
  @body
  resource: Resource;
} | {
  @statusCode(404)
  @body
  error: Error;
} | {
  @statusCode(400)
  @body
  error: Error;
};
```

Using a consistent error model across your API helps clients handle errors uniformly.

## Error Model Best Practices

A well-designed error model should include:

1. **Error code**: A machine-readable identifier
2. **Error message**: A human-readable description
3. **Details**: Additional context about the error
4. **Target**: The specific field or resource causing the error

Here's an example of a comprehensive error model:

```typespec
model Error {
  @doc("A machine-readable error code")
  code: string;

  @doc("A human-readable error message")
  message: string;

  @doc("The target of the error (e.g., field name)")
  target?: string;

  @doc("Additional error details")
  details?: ErrorDetails[];

  @doc("Inner error that caused this error")
  innerError?: InnerError;
}

model ErrorDetails {
  @doc("The target of the detail (e.g., field name)")
  target: string;

  @doc("A machine-readable code for this detail")
  code: string;

  @doc("A human-readable message for this detail")
  message: string;
}

model InnerError {
  @doc("Inner error code")
  code?: string;

  @doc("Inner error message")
  message?: string;

  @doc("Stack trace or additional internal details (hidden from external clients)")
  stackTrace?: string;
}
```

## Using `@error` for Exception Models

TypeSpec provides an `@error` decorator to mark models representing exceptions or errors:

```typespec
@error
model ResourceNotFoundError {
  code: "ResourceNotFound";
  message: string;
  resourceId: string;
}

@error
model ValidationError {
  code: "ValidationFailed";
  message: string;
  fields: string[];
}

@route("/resources/{id}")
@get
op getResource(@path id: string): Resource | ResourceNotFoundError | ValidationError;
```

The `@error` decorator helps TypeSpec tools understand which models represent errors, allowing emitters and documentation generators to handle them appropriately.

## Status Code Patterns

Different HTTP methods typically use specific status codes:

### GET Operations

```typespec
@route("/users/{id}")
@get
op getUser(@path id: string): (OkResponse & {
  @body user: User;
}) | (NotFoundResponse & {
  @body error: Error;
});
```

Common status codes for GET:

- 200 (OK): Resource found and returned
- 304 (Not Modified): Resource hasn't changed (with conditional requests)
- 404 (Not Found): Resource doesn't exist

### POST Operations

```typespec
@route("/users")
@post
op createUser(@body user: CreateUserRequest): (CreatedResponse & {
  @body user: User;
  @header location: string;
}) | (BadRequestResponse & {
  @body error: Error;
});
```

Common status codes for POST:

- 201 (Created): Resource created successfully
- 202 (Accepted): Request accepted for processing
- 400 (Bad Request): Invalid input
- 409 (Conflict): Resource already exists

### PUT Operations

```typespec
@route("/users/{id}")
@put
op updateUser(@path id: string, @body user: UpdateUserRequest): (OkResponse & {
  @body user: User;
}) | (NotFoundResponse & {
  @body error: Error;
}) | (BadRequestResponse & {
  @body error: Error;
});
```

Common status codes for PUT:

- 200 (OK): Resource updated and returned
- 204 (No Content): Resource updated, no content returned
- 400 (Bad Request): Invalid input
- 404 (Not Found): Resource doesn't exist
- 412 (Precondition Failed): Update conflicts with resource state

### DELETE Operations

```typespec
@route("/users/{id}")
@delete
op deleteUser(@path id: string): NoContentResponse | (NotFoundResponse & {
  @body error: Error;
});
```

Common status codes for DELETE:

- 204 (No Content): Resource deleted successfully
- 404 (Not Found): Resource doesn't exist
- 409 (Conflict): Resource cannot be deleted

## Standard Error Responses

It's good practice to standardize error responses across your API. Here's an implementation of common error patterns:

```typespec
@service
namespace EcommerceAPI;

// Base error model
model ErrorResponse {
  code: string;
  message: string;
  details?: ErrorDetail[];
}

model ErrorDetail {
  code: string;
  target: string;
  message: string;
}

// Specific error types
@error
model BadRequestError extends ErrorResponse {
  code: "BadRequest";
}

@error
model NotFoundError extends ErrorResponse {
  code: "NotFound";
  resourceType: string;
  resourceId: string;
}

@error
model AuthenticationError extends ErrorResponse {
  code: "Unauthorized";
}

@error
model ForbiddenError extends ErrorResponse {
  code: "Forbidden";
}

@error
model ConflictError extends ErrorResponse {
  code: "Conflict";
}

@error
model ValidationError extends ErrorResponse {
  code: "ValidationFailed";
}

// Product resource
model Product {
  id: string;
  name: string;
  price: decimal;
  stockQuantity: int32;
}

@route("/products")
interface Products {
  // Get all products
  @get
  listProducts(): Product[];

  // Get a specific product
  @get
  @route("/{id}")
  getProduct(@path id: string): {
    @statusCode(200)
    @body
    product: Product;
  } | {
    @statusCode(404)
    @body
    error: NotFoundError;
  };

  // Create a new product
  @post
  createProduct(@body product: Product): {
    @statusCode(201)
    @body
    product: Product;

    @header location: string;
  } | {
    @statusCode(400)
    @body
    error: ValidationError;
  } | {
    @statusCode(409)
    @body
    error: ConflictError;
  };

  // Update a product
  @put
  @route("/{id}")
  updateProduct(@path id: string, @body product: Product): {
    @statusCode(200)
    @body
    product: Product;
  } | {
    @statusCode(400)
    @body
    error: ValidationError;
  } | {
    @statusCode(404)
    @body
    error: NotFoundError;
  };

  // Delete a product
  @delete
  @route("/{id}")
  deleteProduct(@path id: string): NoContentResponse | {
    @statusCode(404)
    @body
    error: NotFoundError;
  };
}
```

This example demonstrates how to use status codes and error models consistently across an API.

## Status Codes for Asynchronous Operations

Long-running operations often use specific status codes to indicate that processing will continue asynchronously:

```typespec
@route("/jobs")
interface Jobs {
  @post
  createJob(@body job: JobRequest): {
    @statusCode(202) // Accepted
    @body
    status: {
      id: string;
      status: "pending";
    };
    @header("Location") statusUrl: string;
  } | {
    @statusCode(400)
    @body
    error: Error;
  };

  @get
  @route("/{id}/status")
  getJobStatus(@path id: string): {
    @statusCode(200)
    @body
    status: {
      id: string;
      status: "pending" | "in-progress" | "completed" | "failed";
      result?: JobResult;
      error?: Error;
    };
  } | {
    @statusCode(404)
    @body
    error: Error;
  };
}
```

This pattern uses:

- 202 (Accepted) for job creation
- A Location header pointing to a status endpoint
- A separate endpoint to check job status

## Best Practices for Status Codes and Error Responses

When defining status codes and error responses in TypeSpec, follow these best practices:

1. **Be consistent with status code usage** across similar operations:

   ```typespec
   // All creation operations should return 201 Created
   @post
   @statusCode(201)
   op createResource(@body resource: Resource): Resource;
   ```

2. **Use standard status codes** rather than inventing new ones.

3. **Include detailed error information** in 4xx and 5xx responses:

   ```typespec
   @route("/resources")
   @post
   op createResource(@body resource: Resource): (CreatedResponse & {
     @body resource: Resource;
   }) | (BadRequestResponse & {
     @body error: {
       code: string;
       message: string;
       details: string[];
     };
   });
   ```

4. **Use the most specific status code** for each situation:

   - 400 (Bad Request) for invalid inputs
   - 401 (Unauthorized) for missing authentication
   - 403 (Forbidden) for permission issues
   - 404 (Not Found) for missing resources
   - 409 (Conflict) for state conflicts

5. **Document error codes** that clients might encounter:

   ```typespec
   @doc("Error indicating a validation failure")
   @error
   model ValidationError {
     @doc("Always 'ValidationFailed'")
     code: "ValidationFailed";

     @doc("Human-readable error message")
     message: string;

     @doc("List of fields that failed validation")
     fields: string[];
   }
   ```

6. **Use enum or string literals for error codes** to make them predictable:

   ```typespec
   @error
   model ApiError {
     code: "NotFound" | "BadRequest" | "InternalError" | "Throttled";
     message: string;
   }
   ```

7. **Return helpful error messages** that explain the issue and how to fix it.

8. **Include correlation IDs** in error responses for troubleshooting:
   ```typespec
   model Error {
     code: string;
     message: string;
     correlationId: string;
   }
   ```

By following these practices, you'll create an API that clearly communicates success and failure conditions, making it easier for clients to interact with your service correctly.
