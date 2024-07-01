---
id: getting-started-http-07-request-response-bodies
title: Request and Response Bodies
---

# Request and Response Bodies

Request and response bodies can be declared explicitly using the `@body` decorator. This decorator helps to clearly indicate which part of the model is the body of the request or response. While it may not change the API's functionality, it provides several benefits:

1. **Clarity and readability**: Using the `@body` decorator makes it explicit which part of the model is intended to be the body. This can improve the readability of the code, making it easier for developers to understand the structure of the API.
2. **Consistency**: Applying the `@body` decorator consistently across your API definitions can help maintain a uniform style. This can be particularly useful in larger projects with multiple contributors.
3. **Tooling and documentation**: Some tools and documentation generators may rely on the `@body` decorator to produce more accurate and detailed outputs. By explicitly marking the body, you ensure that these tools can correctly interpret and document your API.

Let's add an endpoint to create a pet and use the `@body` decorator for the responses:

```typespec
@route("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): {
    @statusCode statusCode: 200;
    @body pets: Pet[];
  };

  op read(@path petId: int32): {
    @statusCode statusCode: 200;
    @body pet: Pet;
  } | {
    @statusCode statusCode: 404;
  };

  @post
  op create(@body pet: Pet): {
    @statusCode statusCode: 201;
  } | {
    @statusCode statusCode: 400;
    @body error: Error;
  };
}
```

In this example:

- The `@body` decorator is used to explicitly mark the response body for the `list` and `read` operations.
- The `@body` decorator is also used to mark the request body for the `create` operation.

### Implicit vs. Explicit `@body`

Note that in the absence of an explicit `@body`:

1. The set of parameters that are not marked `@header`, `@query`, or `@path` form the request body.
2. The set of properties of the return model that are not marked `@header`, `@query`, or `@path` form the response body.
3. If the return type is not a model, then it defines the response body.

This is how we were able to return `Pet` and `Pet[]` bodies without using `@body` for `list` and `read`. However, using the `@body` decorator makes it explicit and clear.

---

[Previous: Headers](./getting-started-http-06-headers.md) | [Next: Status Codes](./getting-started-http-08-status-codes.md)
