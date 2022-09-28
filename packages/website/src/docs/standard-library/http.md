---
id: http
title: Http And Rest
---

# Http and rest

With the language building blocks we've covered so far we're ready to author our first REST API. Cadl has an official REST API "binding" called `@cadl-lang/rest`. It's a set of Cadl declarations and decorators that describe REST APIs and can be used by code generators to generate OpenAPI descriptions, implementation code, and the like.

Cadl also has an official OpenAPI emitter called `@cadl-lang/openapi3` that consumes the REST API bindings and emits standard OpenAPI descriptions. This can then be fed in to any OpenAPI code generation pipeline.

The following examples assume you have imported both `@cadl-lang/openapi3` and `@cadl-lang/rest` somewhere in your Cadl program (though importing them in `main.cadl` is the standard convention). For detailed library reference, please see rest library's [Readme.md](https://github.com/microsoft/cadl/blob/main/packages/rest/README.md).

## Service definition and metadata

A definition for a service is the namespace that contains all the operations for the service and carries top-level metadata like service name and version. Cadl offers the following decorators for providing this metadata, and all are optional.

- @server - (In `Cadl.Http`) the host of the service. Can accept parameters.

Here's an example that uses these to define a Pet Store service:

```cadl
@service({title: "Pet Store Service", version: "2021-03-25")
@server("https://example.com", "Single server endpoint")
@doc("This is a sample server Petstore server.")
namespace PetStore;
```

The `server` keyword can take a third parameter with parameters as necessary:

```cadl
@server("https://{region}.foo.com", "Regional endpoint", {
  @doc("Region name")
  region?: string = "westus",
})
```

## Resources & routes

Resources are operations that are grouped in a namespace. You declare such a namespace by adding the `@route` decorator to provide the path to that resource:

```cadl
using Cadl.Http;

@route("/pets")
namespace Pets {

}
```

To define an operation on this resource, you need to provide the HTTP verb for the route using the `@get`, `@head` `@post`, `@put`, `@patch`, or `@delete` decorators. Alternatively, you can name your operation `list`, `create`, `read`, `update`, `delete`, or `deleteAll` and the appropriate verb will be used automatically. Lets add an operation to our `Pets` resource:

```cadl
@route("/pets")
namespace Pets {
  op list(): Pet[];

  // or you could also use
  @get op listPets(): Pet[];
}
```

### Automatic route generation

Instead of manually specifying routes using the `@route` decorator, you automatically generate
routes from operation parameters by applying the `@autoRoute` decorator to an operation, namespace,
or interface containing operations.

For this to work, an operation's path parameters (those marked with `@path`) must also be marked with
the `@segment` decorator to define the preceding path segment.

This is especially useful when reusing common parameter sets defined as model types.

For example:

```cadl
model CommonParameters {
  @path
  @segment("tenants")
  tenantId: string;

  @path
  @segment("users")
  userName: string;
}

@autoRoute
interface UserOperations {
  @get
  getUser(...CommonParameters): User | Error;

  @put
  updateUser(...CommonParameters, user: User): User | Error;
}
```

This will result in the following route for both operations

```text
/tenants/{tenantId}/users/{userName}
```

## Path and query parameters

Model properties and parameters which should be passed as path and query parameters use the `@path` and `@query` parameters respectively. Let's modify our list operation to support pagination, and add a read operation to our Pets resource:

```cadl
@route("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): Pet[];
  op read(@path petId: int32): Pet;
}
```

Path parameters are appended to the URL unless a substitution with that parameter name exists on the resource path. For example, we might define a sub-resource using the following Cadl. Note how the path parameter for our sub-resource's list operation corresponds to the substitution in the URL.

```cadl
@route("/pets/{petId}/toys")
namespace PetToys {
  op list(@path petId: int32): Toy[];
}
```

## Request & response bodies

Request and response bodies can be declared explicitly using the `@body` decorator. Let's add an endpoint to create a pet. Let's also use this decorator for the responses, although this doesn't change anything about the API.

```cadl
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
2. The set of properties of the return model that are not marked @header, @query, or @path form the response body.
3. If the return type is not a model, then it defines the response body.

This is how we were able to return Pet and Pet[] bodies without using @body for list and read. We can actually write
create in the same terse style by spreading the Pet object into the parameter list like this:

```cadl
@route("/pets")
namespace Pets {
  @post
  op create(...Pet): {};
}
```

## Polymorphism with discriminators

A pattern often used in REST APIs is to define a request or response body as having one of several different shapes, with a property called the
"discriminator" indicating which actual shape is used for a particular instance.
Cadl supports this pattern with the `@discriminator` decorator of the Rest library.

The `@discriminator` decorator takes one argument, the name of the discriminator property, and should be placed on the
model for the request or response body. The different shapes are then defined by separate models that `extend` this request or response model.
The discriminator property is defined in the "child" models with the value or values that indicate an instance that conforms to its shape.

As an example, a `Pet` model that allows instances that are either a `Cat` or a `Dog` can be defined with

```cadl
@discriminator("kind")
model Pet {
  name: string;
  weight?: float32;
}
model Cat extends Pet {
  kind: "cat";
  meow: int32;
}
model Dog extends Pet {
  kind: "dog";
  bark: string;
}
```

## Headers

Model properties and parameters that should be passed in a header use the `@header` decorator. The decorator takes the header name as a parameter. If a header name is not provided, it is inferred from the property or parameter name. Let's add `etag` support to our pet store's read operation.

```cadl
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

Use the `@header` decorator on a property named `statusCode` to declare a status code for a response. Generally, setting this to just `int32` isn't particularly useful. Instead, use number literal types to create a discriminated union of response types. Let's add status codes to our responses, and add a 404 response to our read endpoint.

```cadl
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
  op create(@body pet: Pet): {
    @statusCode statusCode: 204;
  };
}
```

## Built-in response shapes

Since status codes are so common for REST APIs, Cadl comes with some built-in types for common status codes so you don't need to declare status codes so frequently.

There is also a `Body<T>` type, which can be used as a shorthand for { @body body: T } when an explicit body is required.

Lets update our sample one last time to use these built-in types:

```cadl
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

```cadl
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

```cadl
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
