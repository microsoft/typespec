---
id: getting-started-http-06-headers
title: Headers
---

# Headers

Headers are used to pass additional information with the request or response. Model properties and parameters that should be passed in a header use the `@header` decorator. The decorator takes the header name as a parameter. If a header name is not provided, it is inferred from the property or parameter name.

## What is `etag`?

`etag` stands for "entity tag" and is a part of HTTP headers used for web cache validation and conditional requests from browsers for resources. It is a unique identifier assigned by a web server to a specific version of a resource found at a URL. If the resource content changes, a new and different `etag` is assigned.

## Why add `etag` to the `read` operation?

Adding `etag` to the `read` operation allows the client to make conditional requests. This can help in optimizing network usage and improving performance by allowing the server to respond with a `304 Not Modified` status if the resource has not changed, instead of sending the entire resource again.

Here's how you can add `etag` support to the `read` operation:

```typespec
@route("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): {
    @statusCode statusCode: 200;
    @body pets: Pet[];
  };

  op read(@path petId: int32, @header ifMatch?: string): {
    @statusCode statusCode: 200;
    @header eTag: string;
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

  @put
  op update(@path petId: int32, @body pet: Pet): {
    @statusCode statusCode: 200;
    @body updatedPet: Pet;
  } | {
    @statusCode statusCode: 404;
  };

  @delete
  op delete(@path petId: int32): {
    @statusCode statusCode: 204;
  } | {
    @statusCode statusCode: 404;
  };
}
```

In this example:

- The `ifMatch` header is used in the request to specify the `etag` value that the client has. The server can then compare this value with the current `etag` of the resource.
- The `eTag` header is included in the response to provide the current `etag` value of the resource.

This setup allows the client to make conditional requests based on the `etag` value, which can help in reducing unnecessary data transfer and improving the efficiency of the application.

---

[Previous: Path and Query Parameters](./getting-started-http-05-path-query-parameters.md) | [Next: Request and Response Bodies](./getting-started-http-07-request-response-bodies.md)
