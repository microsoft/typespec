---
title: Resources, Routes, and Status Codes
---

# Resources, Routes, and Status Codes

## Resources and Routes

A resource is a general term for anything that can be identified by a URI and manipulated by HTTP methods. In TypeSpec, the operations for a resource are typically grouped in a route namespace. You declare a route namespace by adding the `@route` decorator to provide the path to that resource:

```typespec
@route("/pets")
namespace Pets {

}
```

Namespaces can be nested to encapsulate different levels of information. For example, you can have a `Pets` namespace that contains operations for managing pets, and a `Toys` namespace that contains operations for managing pet toys, all within the `PetStore` namespace.

Let's add a `Pets` namespace within the `Petstore` namespace, and a `Pet` model to represent unique pets. `Toys` will be added in a later section to demonstrate versioning.

```typespec
namespace PetStore {
  enum Versions {
    v1: "1.0.0",
    v2: "2.0.0",
  }

  @route("/pets")
  namespace Pets {
    @added(Versions.v1)
    model Pet {
      @minLength(1)
      name: string;

      @minValue(0)
      @maxValue(100)
      age: int32;

      kind: "dog" | "cat" | "fish" | "bird" | "reptile";
    }
  }
}
```

To define operations on this resource, you need to provide the HTTP verbs for the route using `operation` decorators. If an HTTP method decorator is not specified, then the default is `@post` if there is a body and `@get` otherwise.

## Status Codes

HTTP status codes are used to indicate the result of an HTTP request. They provide information about whether the request was successful, if there was an error, or if additional action is needed. In TypeSpec, you can use the `@statusCode` decorator to specify the status codes for your API responses.

### Common HTTP Status Codes

Here are some common HTTP status codes and their meanings:

- **200 OK**: The request was successful, and the server returned the requested resource.
- **201 Created**: The request was successful, and a new resource was created.
- **204 No Content**: The request was successful, but there is no content to return.
- **400 Bad Request**: The server could not understand the request due to invalid syntax.
- **401 Unauthorized**: The client must authenticate itself to get the requested response.
- **403 Forbidden**: The client does not have access rights to the content.
- **404 Not Found**: The server cannot find the requested resource.
- **500 Internal Server Error**: The server encountered an unexpected condition that prevented it from fulfilling the request.

### Using the `@statusCode` Decorator

The `@statusCode` decorator is used to specify the status code for a response. You can use number literal types to create a discriminated union of response types, allowing you to handle different status codes in a single operation.

Let's add a `create` operation to our `Pets` resource and use the `@statusCode` decorator to specify the status codes for a successful operation.

```typespec
@route("/pets")
namespace Pets {
  @post
  op create(@body pet: Pet): {
    @statusCode statusCode: 201;
  } | {
    @statusCode statusCode: 400;
    @body error: Error;
  };
}
```

**Note**: This example introduces a `@body` decorator and error handling, which will be covered in detail in later sections.

### Handling Multiple Status Codes

By using discriminated unions, you can handle multiple status codes in a single operation. This allows you to provide detailed responses based on different conditions.

For example, let's add error handling to the `create` operation:

```typespec
@route("/pets")
namespace Pets {
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

- The `create` operation returns a `201 Created` status code when a new pet is successfully created.
- If there is a validation error, the operation returns a `400 Bad Request` status code with an error message.

By defining status codes for your API responses, you can provide clear and consistent feedback to clients, making it easier for them to understand and handle different scenarios. This helps improve the overall user experience and ensures that your API is robust and reliable.
