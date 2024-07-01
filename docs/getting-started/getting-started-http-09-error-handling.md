---
id: getting-started-http-09-error-handling
title: Error Handling
---

# Error Handling

Error handling is a crucial aspect of API design. It ensures that clients receive meaningful feedback when something goes wrong, allowing them to handle errors gracefully. Common error scenarios include validation errors, authorization errors, resource not found errors, and server errors.

## Defining Error Models

In TypeSpec, you can define custom error models to represent different types of errors. These models can include properties such as error codes, messages, and additional details.

```typespec
@error
model ValidationError {
  code: "VALIDATION_ERROR";
  message: string;
  details: string[];
}

@error
model NotFoundError {
  code: "NOT_FOUND";
  message: string;
}

@error
model InternalServerError {
  code: "INTERNAL_SERVER_ERROR";
  message: string;
}
```

## Handling Different Types of Errors

You can handle different types of errors by defining operations that return multiple possible responses using discriminated unions.

```typespec
@route("/pets")
namespace Pets {
  op read(@path petId: int32): {
    @statusCode statusCode: 200;
    @body pet: Pet;
  } | {
    @statusCode statusCode: 404;
    @body error: NotFoundError;
  };

  @post
  op create(@body pet: Pet): {
    @statusCode statusCode: 201;
  } | {
    @statusCode statusCode: 400;
    @body error: ValidationError;
  } | {
    @statusCode statusCode: 500;
    @body error: InternalServerError;
  };
}
```

## Returning Error Responses

By using discriminated unions, you can specify multiple possible responses for an operation, each with its own status code and error model.

```typespec
@route("/pets")
namespace Pets {
  op read(@path petId: int32): {
    @statusCode statusCode: 200;
    @body pet: Pet;
  } | {
    @statusCode statusCode: 404;
    @body error: NotFoundError;
  };

  @post
  op create(@body pet: Pet): {
    @statusCode statusCode: 201;
  } | {
    @statusCode statusCode: 400;
    @body error: ValidationError;
  } | {
    @statusCode statusCode: 500;
    @body error: InternalServerError;
  };
}
```

## Best Practices

- **Consistent Error Response Format**: Use a consistent format for all error responses to make it easier for clients to handle errors.
- **Meaningful Error Messages**: Provide clear and actionable error messages to help clients understand what went wrong and how to fix it.
- **Standard HTTP Status Codes**: Use standard HTTP status codes to indicate the type of error (e.g., 400 for validation errors, 404 for not found errors, 500 for server errors).

---

[Previous: Status Codes](./getting-started-http-08-status-codes.md) | [Next: Summary](./getting-started-http-10-summary.md)
