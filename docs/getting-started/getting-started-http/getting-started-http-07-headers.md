---
id: getting-started-http-07-headers
title: Headers
---

# Headers

Headers are used to pass additional information with the request or response. Model properties and parameters that should be passed in a header use the `@header` decorator. The decorator takes the header name as a parameter. If a header name is not provided, it is inferred from the property or parameter name.

## Using the `@header` Decorator

The `@header` decorator can be used to specify headers in both requests and responses. Here are some common use cases:

- **Authorization**: Passing authentication tokens.
- **Content-Type**: Specifying the media type of the resource.
- **Custom Headers**: Any application-specific headers.

### Example: Authorization Header

Let's add an `Authorization` header to a request:

```typespec
@route("/pets")
namespace Pets {
  op list(@header Authorization: string): {
    @statusCode statusCode: 200;
    @body pets: Pet[];
  };
}
```

### Example: Content-Type Header

Let's specify the `Content-Type` header in a response:

```typespec
@route("/pets")
namespace Pets {
  op create(@header Authorization: string, @body pet: Pet): {
    @statusCode statusCode: 201;
    @header Content-Type: "application/json";
  };
}
```

In this example, the `Content-Type` header is used to specify that the response body is in JSON format.

## Example: `etag` Header

`etag` stands for "entity tag" and is a part of HTTP headers used for web cache validation and conditional requests from browsers for resources. It is a unique identifier assigned by a web server to a specific version of a resource found at a URL. If the resource content changes, a new and different `etag` is assigned.

Let's update our pet store operations to include new operations and update existing operations with relevant headers:

```typespec
@route("/pets")
namespace Pets {
  op list(@header Authorization: string, @query skip: int32, @query top: int32): {
    @statusCode statusCode: 200;
    @body pets: Pet[];
  };

  op read(@header Authorization: string, @path petId: int32, @header ifMatch?: string): {
    @statusCode statusCode: 200;
    @header eTag: string;
    @body pet: Pet;
  } | {
    @statusCode statusCode: 404;
    @body error: NotFoundError;
  };

  @post
  op create(@header Authorization: string, @body pet: Pet): {
    @statusCode statusCode: 201;
    @header Content-Type: "application/json";
  } | {
    @statusCode statusCode: 400;
    @body error: ValidationError;
  } | {
    @statusCode statusCode: 500;
    @body error: InternalServerError;
  };

  @put
  op update(@header Authorization: string, @path petId: int32, @body pet: Pet): {
    @statusCode statusCode: 200;
    @header Content-Type: "application/json";
    @body updatedPet: Pet;
  } | {
    @statusCode statusCode: 404;
    @body error: NotFoundError;
  } | {
    @statusCode statusCode: 400;
    @body error: ValidationError;
  } | {
    @statusCode statusCode: 500;
    @body error: InternalServerError;
  };

  @delete
  op delete(@header Authorization: string, @path petId: int32): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 404;
    @body error: NotFoundError;
  } | {
    @statusCode statusCode: 500;
    @body error: InternalServerError;
  };
}
```

In this example:

- The `Authorization` header is used in all operations to pass an authentication token.
- The `ifMatch` header is used in the `read` operation to specify the `etag` value that the client has. The server can then compare this value with the current `etag` of the resource.
- The `eTag` header is included in the `read` response to provide the current `etag` value of the resource.
- The `Content-Type` header is used in the `create` and `update` operations to specify that the response body is in JSON format.
