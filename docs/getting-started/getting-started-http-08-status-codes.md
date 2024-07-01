---
id: getting-started-http-08-status-codes
title: Status Codes
---

# Status Codes

HTTP status codes are used to indicate the result of an HTTP request. They provide information about whether the request was successful, if there was an error, or if additional action is needed. In TypeSpec, you can use the `@statusCode` decorator to specify the status codes for your API responses.

## Common HTTP Status Codes

Here are some common HTTP status codes and their meanings:

- **200 OK**: The request was successful, and the server returned the requested resource.
- **201 Created**: The request was successful, and a new resource was created.
- **204 No Content**: The request was successful, but there is no content to return.
- **400 Bad Request**: The server could not understand the request due to invalid syntax.
- **401 Unauthorized**: The client must authenticate itself to get the requested response.
- **403 Forbidden**: The client does not have access rights to the content.
- **404 Not Found**: The server cannot find the requested resource.
- **500 Internal Server Error**: The server encountered an unexpected condition that prevented it from fulfilling the request.

## Using the `@statusCode` Decorator

The `@statusCode` decorator is used to specify the status code for a response. You can use number literal types to create a discriminated union of response types, allowing you to handle different status codes in a single operation.

Let's expand our Pet Store example to include more detailed status code handling:

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

- The `list` operation returns a `200 OK` status code with a list of pets.
- The `read` operation returns a `200 OK` status code with the pet details if found, or a `404 Not Found` status code if the pet does not exist.
- The `create` operation returns a `201 Created` status code when a new pet is successfully created.
- The `update` operation returns a `200 OK` status code with the updated pet details if the pet exists, or a `404 Not Found` status code if the pet does not exist.
- The `delete` operation returns a `204 No Content` status code if the pet is successfully deleted, or a `404 Not Found` status code if the pet does not exist.

## Handling Multiple Status Codes

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

---

[Previous: Request and Response Bodies](./getting-started-http-07-request-response-bodies.md) | [Next: Error Handling](./getting-started-http-09-error-handling.md)
