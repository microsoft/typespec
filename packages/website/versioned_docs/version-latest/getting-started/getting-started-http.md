---
title: Getting Started with TypeSpec For Http
---

Let's create a REST API definition with TypeSpec. TypeSpec has an official HTTP API "binding" called `@typespec/http`. It's a set of TypeSpec declarations and decorators that describe HTTP APIs and can be used by code generators to generate OpenAPI descriptions, implementation code, and the like.
Built on top of the http library there is the rest library `@typespec/rest` which provide some REST concept like resources.

TypeSpec also has an official OpenAPI emitter called `@typespec/openapi3` that consumes the HTTP API bindings and emits standard [OpenAPI 3.0](https://spec.openapis.org/oas/v3.0.3) descriptions. This can then be fed in to any OpenAPI code generation pipeline.

References:

- [Http library](../standard-library/http/reference)
- [Rest library](../standard-library/rest/reference)
- [OpenAPI 3 emitter](../standard-library/openapi3/reference)

## Setup

:::note
Make sure to have installed the [editor extension](../introduction/installation.md#install-the-vs-and-vscode-extensions) to get syntax highlighting and intellisense.
:::

1. Make a new folder somewhere
2. Run `npx --package=@typespec/compiler tsp init` and select the `Generic Rest API` template
3. Run `npm install` to install dependencies
4. Run `npx tsp compile .` to compile the initial file
   You can either run `npx tsp compile . --watch` to automatically compile change on save or keep running the command manually after that.

Resulting file structure:

```
main.tsp
tspconfig.yaml
package.json
node_modules/
tsp-output/
  @typespec/
    openapi3/
      openapi.yaml
```

## Service definition and metadata

A definition for a service is the namespace that contains all the operations for the service and carries top-level metadata like service name and version. TypeSpec offers the following decorators for providing this metadata, and all are optional.

- `@service` - Mark a namespace as a service namespace. Takes in the following options:
  - `title`: Name of the service
  - `version`: Version of the service
- `@server` - (In `TypeSpec.Http`) the host of the service. Can accept parameters.

Here's an example that uses these to define a Pet Store service:

```typespec
using TypeSpec.Http;
using TypeSpec.Rest;

/**
 * This is a sample server Petstore server.
 */
@service({
  title: "Pet Store Service",
  version: "2021-03-25",
})
@server("https://example.com", "Single server endpoint")
namespace PetStore;
```

The `server` keyword can take a third parameter with parameters as necessary:

```typespec
@server("https://{region}.foo.com", "Regional endpoint", {
  /** Region name */
  region?: string = "westus",
})
```

## Resources & routes

Resource is a general term for anything that can be identified by a URL and manipulated by HTTP methods.
In TypeSpec, the operations for a resource are typically grouped in a namespace. You declare such a namespace by adding the `@route` decorator to provide the path to that resource:

```typespec
@route("/pets")
namespace Pets {

}
```

Lets add a pet model in the namespace

```tsp
model Pet {
  @minLength(100)
  name: string;

  @minValue(0)
  @maxValue(100)
  age: int32;

  kind: "dog" | "cat" | "fish";
}
```

To define an operation on this resource, you need to provide the HTTP verb for the route using the `@get`, `@head` `@post`, `@put`, `@patch`, or `@delete` decorators. If an HTTP method decorator is not specified then the default is post if there is a body and get otherwise. Lets add an operation to our `Pets` resource:

```typespec
@route("/pets")
namespace Pets {
  op list(): Pet[];

  // or you could also use
  @get op listPets(): Pet[];
}
```

### Automatic route generation

Instead of manually specifying routes using the `@route` decorator, you automatically generate routes from operation parameters by applying the `@autoRoute` decorator to an operation or interface containing operations.

For this to work, an operation's path parameters (those marked with `@path`) must also be marked with
the `@segment` decorator to define the preceding path segment.

This is especially useful when reusing common parameter sets defined as model types.

For example:

```typespec
model CommonParameters {
  @path
  @segment("tenants")
  tenantId: string;

  @path
  @segment("users")
  userName: string;
}

model User {
  name: string;
}
@error
model Error {
  message: string;
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

Model properties and parameters which should be passed as path and query parameters use the `@path` and `@query` decorators respectively. Let's modify our list operation to support pagination, and add a read operation to our Pets resource:

```typespec
@route("/pets")
namespace Pets {
  op list(@query skip?: int32, @query top?: int32): Pet[];
  op read(@path petId: int32): Pet;
}
```

Path parameters are appended to the URL unless a substitution with that parameter name exists on the resource path. For example, we might define a sub-resource using the following TypeSpec. Note how the path parameter for our sub-resource's list operation corresponds to the substitution in the URL.

```typespec
@route("/pets/{petId}/toys")
namespace PetToys {
  model Toy {
    name: string;
  }
  op list(@path petId: int32): Toy[];
}
```

## Headers

Model properties and parameters that should be passed in a header use the `@header` decorator. The decorator takes the header name as a parameter. If a header name is not provided, it is inferred from the property or parameter name. Let's add `etag` support to our pet store's read operation.

```typespec
@route("/pets")
namespace Pets {
  op list(@query skip: int32, @query top: int32): Pet[];
  op read(@path petId: int32, @header ifMatch?: string): {
    @header eTag: string;
    @body pet: Pet;
  };
  @post
  op create(@body pet: Pet): {};
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
2. The set of properties of the return model that are not marked @header, @query, or @path form the response body.
3. If the return type is not a model, then it defines the response body.

This is how we were able to return Pet and Pet[] bodies without using @body for list and read. We can actually write
create in the same terse style by spreading the Pet object into the parameter list like this:

```typespec
@route("/pets")
namespace Pets {
  @post
  op create(...Pet): {};
}
```

## Status codes

Use the `@statusCode` decorator on a property to declare a status code for a response. Generally, setting this to just `int32` isn't particularly useful. Instead, use number literal types to create a discriminated union of response types. Let's add status codes to our responses, and add a 404 response to our read endpoint.

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
  op create(@body pet: Pet): {
    @statusCode statusCode: 204;
  };
}
```
