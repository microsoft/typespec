# Error Handling Patterns

## Introduction to Error Handling

Proper error handling is a critical aspect of REST API design. Well-designed error responses make it easier for clients to understand what went wrong and how to resolve issues. TypeSpec's REST library provides robust patterns for implementing consistent error handling across your API.

## Why Error Handling Matters

Effective error handling is important for several reasons:

1. **Developer Experience**: Clear error messages improve the API's usability for developers
2. **Debuggability**: Detailed errors make troubleshooting easier
3. **Client Resilience**: Standardized errors allow clients to implement appropriate recovery logic
4. **Documentation**: Well-defined error types inform API consumers about possible failure modes

## HTTP Status Codes in REST APIs

HTTP provides standardized status codes that should be used appropriately:

### Common Status Codes

- **2xx**: Success

  - `200 OK`: Request succeeded
  - `201 Created`: Resource created successfully
  - `204 No Content`: Success with no response body

- **4xx**: Client Errors

  - `400 Bad Request`: Malformed request
  - `401 Unauthorized`: Authentication required
  - `403 Forbidden`: Authorization failure
  - `404 Not Found`: Resource doesn't exist
  - `409 Conflict`: Request conflicts with current state
  - `429 Too Many Requests`: Rate limit exceeded

- **5xx**: Server Errors
  - `500 Internal Server Error`: Unexpected server error
  - `501 Not Implemented`: Functionality not supported
  - `503 Service Unavailable`: Service temporarily unavailable

## Error Response Structure

TypeSpec's REST library provides standard models for error responses:

```typespec
model Error {
  code: string;
  message: string;
  target?: string;
  details?: Error[];
  innererror?: InnerError;
}

model InnerError {
  code?: string;
  innererror?: InnerError;
}
```

Key components include:

- `code`: Machine-readable error code
- `message`: Human-readable error description
- `target`: Specific field or resource that caused the error
- `details`: Additional errors for multi-part failures
- `innererror`: Additional error details for debugging

## Implementing Error Responses in TypeSpec

### Basic Error Handling

Define standard error responses for operations:

```typespec
@error
model NotFoundError {
  code: "ResourceNotFound";
  message: string;
  target?: string;
}

@error
model ValidationError {
  code: "ValidationFailed";
  message: string;
  target?: string;
  details?: ValidationError[];
}

@route("/products/{id}")
interface ProductOperations {
  @get
  @error(NotFoundError, 404)
  read(@path id: string): Product;
}
```

### Operation-specific Errors

Define errors specific to particular operations:

```typespec
@error
model InsufficientInventoryError {
  code: "InsufficientInventory";
  message: string;
  availableQuantity: int32;
  requestedQuantity: int32;
}

@route("/orders")
interface Orders {
  @post
  @error(ValidationError, 400)
  @error(InsufficientInventoryError, 400)
  @error(UnauthorizedError, 401)
  create(@body order: OrderRequest): Order;
}
```

### Shared Error Definitions

Define common errors in a separate namespace for reuse:

```typespec
namespace Errors;

@error
model NotFoundError {
  code: "ResourceNotFound";
  message: string;
  target?: string;
}

@error
model ValidationError {
  code: "ValidationFailed";
  message: string;
  target?: string;
  details?: ValidationError[];
}

@error
model UnauthorizedError {
  code: "Unauthorized";
  message: string;
}
```

Then import and use them:

```typespec
import "./errors.tsp";

@route("/products/{id}")
interface ProductOperations {
  @get
  @error(Errors.NotFoundError, 404)
  @error(Errors.UnauthorizedError, 401)
  read(@path id: string): Product;
}
```

## Error Inheritance

Create error hierarchies to model related errors:

```typespec
@error
model ApiError {
  code: string;
  message: string;
  target?: string;
}

@error
model ValidationError extends ApiError {
  code: "ValidationFailed";
  details?: ValidationError[];
}

@error
model ResourceValidationError extends ValidationError {
  code: "ResourceValidationFailed";
  resourceType: string;
}
```

## Documenting Errors

Use the `@doc` decorator to explain errors:

```typespec
@error
@doc("Returned when a requested resource doesn't exist")
model NotFoundError {
  @doc("Error code")
  code: "ResourceNotFound";

  @doc("Human-readable error message")
  message: string;

  @doc("Resource identifier that was not found")
  target?: string;
}
```

## Error Response Examples

### Basic Error Response

A basic error when a resource is not found:

```json
{
  "code": "ResourceNotFound",
  "message": "The product with ID 'abc123' could not be found.",
  "target": "abc123"
}
```

### Validation Error with Details

A validation error with multiple issues:

```json
{
  "code": "ValidationFailed",
  "message": "The request has validation errors.",
  "details": [
    {
      "code": "InvalidValue",
      "message": "Price must be greater than zero.",
      "target": "price"
    },
    {
      "code": "RequiredField",
      "message": "Name is a required field.",
      "target": "name"
    }
  ]
}
```

### Error with Inner Error Details

An error with additional debugging information:

```json
{
  "code": "InternalServerError",
  "message": "An unexpected error occurred.",
  "innererror": {
    "code": "DatabaseConnectionFailed",
    "innererror": {
      "code": "Timeout",
      "message": "Operation timed out after 30 seconds."
    }
  }
}
```

## Implementing Standard Error Patterns

### Using the Standard REST Error Models

The TypeSpec REST library provides standard error models:

```typespec
import "@typespec/rest";

using TypeSpec.Rest;

@route("/products")
interface Products {
  @get
  @error(RestError, 400, 401, 403, 429)
  @error(NotFoundError, 404)
  @error(ServiceError, 500, 503)
  list(): Product[];
}
```

### Creating Custom Error Status Code Maps

Define custom status code mappings for errors:

```typespec
@errorStatusCode
interface ApiErrorStatusCodes {
  NotFoundError: 404;
  ValidationError: 400;
  UnauthorizedError: 401;
  ForbiddenError: 403;
  InternalServerError: 500;
}

@useErrorStatusCode(ApiErrorStatusCodes)
@route("/products")
interface Products {
  @get
  @error(NotFoundError)   // Will map to 404
  @error(ValidationError) // Will map to 400
  list(): Product[];
}
```

### Handling Multiple Response Types

Define operations that can return different types based on status:

```typespec
@route("/products/{id}")
interface ProductOperations {
  @get
  @returnsDoc(200, "The product was found")
  @returnsDoc(404, "The product was not found")
  read(@path id: string): {
    @statusCode _: 200;
    @body product: Product;
  } | {
    @statusCode _: 404;
    @body error: NotFoundError;
  };
}
```

## Error Handling for Different Resource Types

### CRUD Operation Errors

Define standard errors for CRUD operations:

```typespec
@resource("products")
model Product {
  @key
  id: string;

  name: string;
  price: decimal;
}

@route("/products")
interface Products {
  @get
  @error(ValidationError, 400)
  @error(UnauthorizedError, 401)
  list(): Product[];

  @post
  @error(ValidationError, 400)
  @error(UnauthorizedError, 401)
  @error(ConflictError, 409)
  create(@body product: ProductCreateRequest): Product;
}

@route("/products/{id}")
interface ProductOperations {
  @get
  @error(NotFoundError, 404)
  @error(UnauthorizedError, 401)
  read(@path id: string): Product;

  @put
  @error(NotFoundError, 404)
  @error(ValidationError, 400)
  @error(UnauthorizedError, 401)
  @error(ConflictError, 409)
  update(@path id: string, @body product: ProductUpdateRequest): Product;

  @delete
  @error(NotFoundError, 404)
  @error(UnauthorizedError, 401)
  @error(ConflictError, 409)
  delete(@path id: string): void;
}
```

### Long-Running Operation Errors

Define errors for operations that take time to complete:

```typespec
@error
model OperationFailedError {
  code: "OperationFailed";
  message: string;
  operationId: string;
  reason: string;
}

@route("/imports")
interface ImportOperations {
  @post
  @error(ValidationError, 400)
  @error(UnauthorizedError, 401)
  @error(RateLimitError, 429)
  startImport(@body request: ImportRequest): {
    @statusCode _: 202;
    @header("Operation-Location") operationUrl: string;
    @body status: OperationStatus;
  };

  @get
  @path("/{operationId}")
  @error(NotFoundError, 404)
  @error(UnauthorizedError, 401)
  @error(OperationFailedError, 400)
  getStatus(@path operationId: string): OperationStatus;
}
```

## Best Practices for Error Handling

1. **Use Standard HTTP Status Codes**: Choose appropriate status codes for each error type.

2. **Provide Clear Error Messages**: Write user-friendly messages explaining what went wrong.

3. **Include Error Codes**: Use consistent, documented error codes for programmatic handling.

4. **Link to Documentation**: Consider including URLs to documentation for complex errors.

```typespec
@error
model ApiError {
  code: string;
  message: string;
  documentation?: url;
}
```

5. **Add Request Identifiers**: Include a request ID for tracking and support.

```typespec
@error
model ApiError {
  code: string;
  message: string;
  requestId: string;
}
```

6. **Be Consistent**: Use the same error format across your entire API.

7. **Balance Information and Security**: Provide enough detail to be helpful, but avoid exposing sensitive information.

8. **Localize Error Messages**: Consider supporting multiple languages for error messages.

```typespec
@error
model ApiError {
  code: string;
  message: string;
  localizedMessage?: Record<string>;
}
```

9. **Document All Possible Errors**: Ensure each operation documents all error responses it might return.

10. **Validate Error Responses**: Test that your API returns the documented errors in the expected format.

In the next section, we'll explore authentication and authorization patterns for REST APIs.
