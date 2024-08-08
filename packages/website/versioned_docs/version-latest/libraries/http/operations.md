---
title: Operations
---

# Http Operations

## Operation verb

**Default behavior:**

- If `@post` operation has a request body
- `@get` otherwise

**Configure:**

You can use one of the [verb decorators](./reference/decorators.md): `@get`, `@put`, etc.

## Route

An operation route can be specified using the `@route` decorator.

```typespec
@route("/pets") op list(): Pet[];
```

Route path parameters are declared using `{}`. Providing `@path` on the model property with the matching name is optional.

```typespec
@route("/pets/{petId}") op get(petId: string): Pet;
// or explicit @path
@route("/pets/{petId}") op get(@path petId: string): Pet;
```

Route can be specified on a parent namespace or interface. In that case all the operations, interfaces and namespaces underneath will be prefixed with it.

```typespec
@route("/store")
namespace PetStore {
  op hello(): void; // `/store`
  @route("ping") op ping(): void; // `/store/ping`

  @route("/pets")
  interface Pets {
    list(): Pet[]; // `/store/pets`
    @route("{petId}") read(petId: string): Pet; // `/store/pets/{petId}`
  }
}
```

## Path and query parameters

Model properties and parameters which should be passed as path and query parameters use the `@path` and `@query` parameters respectively. Let's modify our list operation to support pagination, and add a read operation to our Pets resource:

```typespec
@route("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): Pet[];
  op read(@path petId: int32): Pet;
}
```

Path parameters are appended to the URL unless a substitution with that parameter name exists on the resource path. For example, we might define a sub-resource using the following TypeSpec. Note how the path parameter for our sub-resource's list operation corresponds to the substitution in the URL.

```typespec
@route("/pets/{petId}/toys")
namespace PetToys {
  op list(@path petId: int32): Toy[];
}
```

## Request & response bodies

Request and response bodies can be declared explicitly using the `@body` decorator. Let's add an endpoint to create a pet. Let's also use this decorator for the responses, although this doesn't change anything about the API.

```typespec
@route("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): {
    @body pets: Pet[];
  };
  op read(@path petId: int32): {
    @body pet: Pet;
  };
  @post
  op create(@body pet: Pet): {};
}
```

Note that in the absence of explicit `@body`:

1. The set of parameters that are not marked @header, @query, or @path form the request body.
2. The set of properties of the return model that are not marked @header or @statusCode form the response body.
3. If the return type is not a model, then it defines the response body.

This is how we were able to return Pet and Pet[] bodies without using @body for list and read. We can actually write
create in the same terse style by spreading the Pet object into the parameter list like this:

See also [metadata](./operations.md#metadata) for more advanced details.

```typespec
@route("/pets")
namespace Pets {
  @post
  op create(...Pet): {};
}
```

## Headers

Model properties and parameters that should be passed in a header use the `@header` decorator. The decorator takes the header name as a parameter. If a header name is not provided, it is inferred from the property or parameter name. Let's add `etag` support to our pet store's read operation.

```typespec
@route("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): {
    @body pets: Pet[];
  };
  op read(@path petId: int32, @header ifMatch?: string): {
    @header eTag: string;
    @body pet: Pet;
  };
  @post
  op create(@body pet: Pet): {};
}
```

## Status codes

**Default behavior:**

- `4xx,5xx` if response is marked with `@error`
- `200` otherwise

**Configure:**

Use the `@statusCode` decorator on a property to declare a status code for a response. Generally, setting this to just `int32` isn't particularly useful. Instead, use number literal types to create a discriminated union of response types. Let's add status codes to our responses, and add a 404 response to our read endpoint.

```typespec
@route("/pets")
namespace Pets {
  @error
  model Error {
    code: string;
  }

  op list(@query skip: int32, @query top: int32): {
    @body pets: Pet[]; // statusCode: 200 Implicit
  };
  op read(@path petId: int32, @header ifMatch?: string): {
    @statusCode statusCode: 200;
    @header eTag: string;
    @body pet: Pet;
  } | {
    @statusCode statusCode: 404;
  };
  op create(@body pet: Pet): {
    @statusCode statusCode: 204;
  } | Error; //statusCode: 4xx,5xx as Error use `@error` decorator
}
```

## Content type

[See content types docs](./content-types.md)

### Default behavior

Depending on the body of the operation http library will assume different content types:

- `bytes`: `application/octet-stream`
- `string`: `text/plain`
- an `object` or anything else: `application/json`

**Examples:**

```typespec
op download(): bytes; // response content type is application/octet-stream
op upload(@body file: bytes): void; // request content type is application/octet-stream
op getContent(): string; // response content type is text/plain
op getPet(): {
  // response content type is application/json
  name: string;
};
```

### Specify content type

The content type for an operation can be specified by including a header parameter named `contentType`.

#### Request content type

```typespec
op uploadImage(@header contentType: "image/png", @body image: bytes): void;
```

#### Response content type:

```typespec
op downloadImage(): {
  @header contentType: "image/png";
  @body image: bytes;
};
```

#### Multiple content types

```typespec
op uploadImage(@header contentType: "image/png" | "image/jpeg", @body image: bytes): void;
```

## Built-in response shapes

Since status codes are so common for REST APIs, TypeSpec comes with some built-in types for common status codes so you don't need to declare status codes so frequently.

There is also a `Body<T>` type, which can be used as a shorthand for { @body body: T } when an explicit body is required.

Lets update our sample one last time to use these built-in types:

```typespec
model ETag {
  @header eTag: string;
}
@route("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): OkResponse & Body<Pet[]>;
  op read(@path petId: int32, @header ifMatch?: string): (OkResponse &
    Body<Pet> &
    ETag) | NotFoundResponse;
  @post
  op create(...Pet): NoContentResponse;
}
```

Note that the default status code is 200 for non-empty bodies and 204 for empty bodies. Similarly, explicit `Body<T>` is not required when T is known to be a model. So the following terser form is equivalent:

```typespec
@route("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): Pet[];
  op read(@path petId: int32, @header ifMatch?: string): (Pet & ETag) | NotFoundResponse;
  @post
  op create(...Pet): {};
}
```

Finally, another common style is to make helper response types that are
shared across a larger service definition. In this style, you can be
entirely explicit while also keeping operation definitions concise.

For example, we could write :

```typespec
model ListResponse<T> {
  ...OkResponse;
  ...Body<T[]>;
}

model ReadSuccessResponse<T> {
  ...OkResponse;
  ...ETag;
  ...Body<T>;
}

alias ReadResponse<T> = ReadSuccessResponse<T> | NotFoundResponse;

model CreateResponse {
  ...NoContentResponse;
}

@route("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): ListResponse<Pet>;
  op read(@path petId: int32, @header ifMatch?: string): ReadResponse<Pet>;
  @post
  op create(...Pet): CreateResponse;
}
```

## Automatic visibility

The `@typespec/rest` library understands the following well-known [visibilities](../../standard-library/built-in-decorators.md) and provides functionality for emitters to apply them based on whether on request vs. response and HTTP method usage as detailed in the table below.

See [handling visibility and metadata](../../extending-typespec/emitter-metadata-handling.md) for how to incorporate this into

| Name     | Visible in           |
| -------- | -------------------- |
| "read"   | Any response         |
| "query"  | GET or HEAD request  |
| "create" | POST or PUT request  |
| "update" | PATCH or PUT request |
| "delete" | DELETE request       |

This allows a single logical TypeSpec model to be used as in the following example:

```typespec
model User {
  name: string;
  @visibility("read") id: string;
  @visibility("create") password: string;
}

@route("/users")
interface Users {
  @post create(@path id: string, ...User): User;
  @get get(@path id: string): User;
}
```

There is a single logical user entity represented by the single TypeSpec type `User`, but the HTTP payload for this entity varies based on context. When returned in a response, the `id` property is included, but when sent in a request, it is not. Similarly, the `password` property is only included in create requests, but not present in responses.

The OpenAPI v3 emitter will apply these visibilities automatically, without explicit use of `@withVisibility`, and it will generate separate schemas suffixed by visibility when necessary. `@visibility("read")` can be expressed in OpenAPI without generating additional schema by specifying `readOnly: true` and the OpenAPI v3 emitter will leverage this a an optimization, but other visibilities will generate additional schemas. For example, `@visibility("create")` applied to a model property of a type named Widget will generate a `WidgetCreate` schema.

Another emitter such as one generating client code can see and preserve a single logical type and deal with these HTTP payload differences by means other than type proliferation.

Modeling with logical entities rather than HTTP-specific shapes also keeps the TypeSpec spec decoupled from HTTP and REST and can allow the same spec to be used with multiple protocols.

## Metadata

The properties that designate content for the HTTP envelope (`@header`, `@path`, `@query`, `@statusCode`) rather than the content in an HTTP payload are often called "metadata".

Metadata is determined to be applicable or inapplicable based on the context that it is used:

| Context       | Applicability       |
| ------------- | ------------------- |
| `@query`      | request only        |
| `@path`       | request only        |
| `@statusCode` | response only       |
| `@header`     | request or response |

Additionally metadata that appears in an array element type always inapplicable.

When metadata is deemed "inapplicable", for example, if a `@path` property is seen in a response, it becomes part of the payload instead unless the [@includeInapplicableMetadataInPayload](./reference/decorators.md#@TypeSpec.Http.includeInapplicableMetadataInPayload) decorator is used and given a value of `false`.

The handling of metadata applicability furthers the goal of keeping a single logical model in TypeSpec. For example, this defines a logical `User` entity that has a name, ID and password, but further annotates that the ID is sent in the HTTP path and the HTTP body in responses. Also, using automatically visibility as before, we further indicate that the password is only present in create requests.

```typespec
model User {
  name: string;
  @path id: string;
  @visibility("create") password: string;
}
```

Then, we can write operations in terms of the logical entity:

```typespec
@route("/users")
interface Users {
  @post create(...User): User;
}
```

Abstractly, this expresses that a create operation that takes and returns a user. But concretely, at the HTTP protocol level, a create request and response look like this:

```
POST /Users/TypeSpecFan42 HTTP/1.1
Content-Type: application/json
{
  "name": "TypeSpec Fan",
  "password": "Y0uW1llN3v3rGu3ss!"
}

HTTP/1.1 200 OK
Content-Type: application/json
{
  name: "TypeSpec Fan",
  id: "TypeSpecFan42
}
```

### Visibility vs. Metadata applicability

Metadata properties are filtered based on visibility as [described above](#automatic-visibility). This is done independently before applicability is considered. If a a metadata property is not visible then it is neither part of the envelope nor the HTTP payload, irrespective of its applicability.

### Nested metadata

Metadata properties are not required to be top-level. They can also be nested deeper in a parameter or response model type. For example:

```typespec
model Thing {
  headers: {
    @header example: string;
  };
  name: string;
}
```

Note that nesting in this sense does not require the use of anonymous models. This is equivalent:

```typespec
model Thing {
  headers: Headers;
  name: string;
}
model Headers {
  @header example: string;
}
```

In the event that this nesting introduces duplication, then the least nested property with a given name is preferred and the duplicate metadata properties are ignored.

```typespec
model Thing {
  headers: {
    @header example: string; // preferred
    more: {
      @header example: string; // ignored
    };
  };
}
```

## Emitter resources

See [Handling metadata and visibility in emitters for REST API](../../extending-typespec/emitter-metadata-handling.md) for information on how to handle metadata applicability and automatic visibility in a custom emitter.
