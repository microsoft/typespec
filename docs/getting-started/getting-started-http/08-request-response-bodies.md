---
title: Request and Response Bodies
---

# Request and Response Bodies

Request and response bodies can be declared explicitly using the `@body` decorator. This decorator helps to clearly indicate which part of the model is the body of the request or response. While it may not change the API's functionality, it provides several benefits:

1. **Clarity and readability**: Using the `@body` decorator makes it explicit which part of the model is intended to be the body. This can improve the readability of the code, making it easier for developers to understand the structure of the API.
2. **Consistency**: Applying the `@body` decorator consistently across your API definitions can help maintain a uniform style. This can be particularly useful in larger projects with multiple contributors.
3. **Tooling and documentation**: Some tools and documentation generators may rely on the `@body` decorator to produce more accurate and detailed outputs. By explicitly marking the body, you ensure that these tools can correctly interpret and document your API.

Let's revisit some of or pet store operations that use the `@body` decorator:

```typespec
@route("/pets")
namespace Pets {
  model Pet {
    @minLength(1)
    name: string;

    @minValue(0)
    @maxValue(100)
    age: int32;

    kind: "dog" | "cat" | "fish" | "bird" | "reptile";
  }

  op list(@header Authorization: string, @query skip?: int32, @query top?: int32): {
    @statusCode statusCode: 200;
    @body pets: Pet[];
  };

  op read(@header Authorization: string, @path petId: int32): {
    @statusCode statusCode: 200;
    @body pet: Pet;
  } | {
    @statusCode statusCode: 404;
    @body error: NotFoundError;
  };

  @post
  op create(@header Authorization: string, @body pet: Pet): {
    @statusCode statusCode: 201;
    @header contentType: "application/json";
    @body message: string;
  } | {
    @statusCode statusCode: 400;
    @body error: ValidationError;
  } | {
    @statusCode statusCode: 500;
    @body error: InternalServerError;
  };
}
```

### Explanation

- **Pet Model**: The `Pet` model defines the structure of a pet with fields for `name`, `age`, and `kind`.

  - `name`: A string field with a minimum length of 1.
  - `age`: An integer field with a minimum value of 0 and a maximum value of 100.
  - `kind`: A string field that can be one of "dog", "cat", "fish", "bird", or "reptile".

- **list Operation**: The `list` operation returns a list of pets. The response body is explicitly marked with the `@body` decorator to indicate that it contains an array of `Pet` objects.

- **read Operation**: The `read` operation retrieves a specific pet by its ID. The response body is explicitly marked with the `@body` decorator to indicate that it contains a `Pet` object.

- **create Operation**: The `create` operation creates a new pet. The request body is explicitly marked with the `@body` decorator to indicate that it contains a `Pet` object. This means that when a client sends a request to create a new pet, the request body must include the `name`, `age`, and `kind` fields as defined in the `Pet` model.

### Example Request for Create Operation

Here is an example of what the request body might look like when creating a new pet:

```json
{
  "name": "Buddy",
  "age": 5,
  "kind": "dog"
}
```

This JSON object matches the structure of the `Pet` model, with fields for `name`, `age`, and `kind`.

### Implicit vs. Explicit `@body`

Note that in the absence of an explicit `@body`:

1. **Request Body**: The set of parameters that are not marked with `@header`, `@query`, or `@path` will automatically form the request body.

2. **Response Body**: The set of properties of the return model that are not marked with `@header`, `@query`, or `@path` will automatically form the response body.

3. **Non-Model Return Types**: If the return type of an operation is not a model (e.g., a primitive type like `string` or `int32`), then that return type itself defines the response body. For example, if an operation returns a `string` without using the `@body` decorator, the `string` will be the response body.

Here's an example to illustrate these points:

```typespec
@route("/example")
namespace Example {
  op implicitBody(param1: string, param2: int32): string {
    // param1 and param2 form the request body
    // The return type (string) forms the response body
  }
}
```

In this example:

- `param1` and `param2` are not marked with `@header`, `@query`, or `@path`, so they automatically form the request body.
- The return type is `string`, so the response body is the `string` itself.

### `@bodyRoot` Decorator

The `@bodyRoot` decorator is used when you want to specify that the entire body of the request or response should be a single value, rather than an object with multiple properties. This is useful when the body is a primitive type or a single model instance.

#### Example

Let's revisit some of our pet store operations that can benefit from using the `@bodyRoot` decorator:

```typespec
@route("/pets")
namespace Pets {
  @post
  op create(@header Authorization: string, @bodyRoot pet: Pet): {
    @statusCode statusCode: 201;
    @header contentType: "application/json";
    @bodyRoot message: string;
  } | {
    @statusCode statusCode: 400;
    @bodyRoot error: ValidationError;
  } | {
    @statusCode statusCode: 500;
    @bodyRoot error: InternalServerError;
  };

  op read(@header Authorization: string, @path petId: int32): {
    @statusCode statusCode: 200;
    @header eTag: string;
    @bodyRoot pet: Pet;
  } | {
    @statusCode statusCode: 404;
    @bodyRoot error: NotFoundError;
  };
}
```

In this example:

- The `@bodyRoot` decorator is used to indicate that the entire request body for the `create` operation is the `pet` parameter.
- The `@bodyRoot` decorator is also used to indicate that the entire response body for the `create` and `read` operations is either the `message`, `pet`, or `error` value.

### Recommendation

While TypeSpec can infer the request and response bodies in the absence of an explicit `@body` decorator, this can sometimes be confusing for developers. Therefore, it is recommended to use the `@body` decorator explicitly to clearly indicate which part of the model is intended to be the body. This improves the readability and maintainability of your API definitions.

Similarly, use the `@bodyRoot` decorator when the entire body should be a single value. This makes it clear that the body is not an object with multiple properties, but a single entity, improving clarity and consistency in your API definitions.
