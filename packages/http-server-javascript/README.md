# @typespec/http-server-javascript

:warning: **This package is highly experimental and may be subject to breaking changes and bugs.** Please expect that your code may need to be updated as this package evolves, and please report any issues you encounter.

TypeSpec HTTP server code generator for JavaScript and TypeScript.

This package generates an implementation of an HTTP server layer for a TypeSpec API. It supports binding directly to a
Node.js HTTP server or Express.js application.

## Install

```bash
npm install @typespec/http-server-javascript
```

## Emitter

### Usage

1. Via the command line

```bash
tsp compile . --emit=@typespec/http-server-javascript
```

2. Via the config

```yaml
emit:
  - "@typespec/http-server-javascript"
```

### Emitter options

#### `express`

**Type:** `boolean`

If set to `true`, the emitter will generate a router that exposes an Express.js middleware function in addition to the
ordinary Node.js HTTP server router.

If this option is not set to `true`, the `expressMiddleware` property will not be present on the generated router.

#### `omit-unreachable-types`

**Type:** `boolean`

By default, the emitter will create interfaces that represent all models in the service namespace. If this option is set
to `true`, the emitter will only emit those types that are reachable from an HTTP operation.

#### `no-format`

**Type:** `boolean`

If set to `true`, the emitter will not format the generated code using Prettier.

## Functionality and generated code

The emitter generates a few major components:

### Router

The highest-level component that your code interacts with directly is the router implementation.
`@typespec/http-server-javascript` generates a static router that you can bind to an implementation of an HTTP server.

The router is generated in the `http/router.js` module within the output directory. Each service will have its own
router implementation named after the service. For example, given a service namespace named `Todo`, the router module
will export a function `createTodoRouter`. This function creates an instance of a router that dispatches methods within
the `Todo` service.

```ts
import { createTodoRouter } from "../tsp-output/@typespec/http-server-javascript/http/router.js";

const router = createTodoRouter(users, todoItems, attachments);
```

As arguments, the `createTodoRouter` function expects implementations of the underlying service interfaces. These
interfaces are explained further in the next section.

Once the router is created, it is bound to an instance of the HTTP server. The router's `dispatch` method implements the
Node.js event handler signature for the `request` event on a Node.js HTTP server.

```ts
const server = http.createServer();

server.on("request", router.dispatch);

server.listen(8080, () => {
  console.log("Server listening on http://localhost:8080");
});
```

Alternatively, the router can be used with Express.js instead of the Node.js HTTP server directly. If the `express`
feature is enabled in the emitter options, the router will expose an `expressMiddleware` property that implements the
Express.js middleware interface.

```ts
import express from "express";

const app = express();

app.use(router.expressMiddleware);

app.listen(8080, () => {
  console.log("Server listening on http://localhost:8080");
});
```

### Service interfaces

The emitter generates interfaces for each collection of service methods that exists in the service namespace.
Implementations of these interfaces are required to instantiate the router. When the router processes an HTTP request,
it will call the appropriate method on the service implementation after determining the route and method.

For example, given the following TypeSpec namespace `Users` within the `Todo` service:

```tsp
namespace Users {
  @route("/users")
  @post
  op create(
    user: User,
  ): WithStandardErrors<UserCreatedResponse | UserExistsResponse | InvalidUserResponse>;
}
```

The emitter will generate a corresponding interface `Users` within the module `models/all/todo/index.js` in the output
directory.

```ts
/** An interface representing the operations defined in the 'Todo.Users' namespace. */
export interface Users<Context = unknown> {
  create(
    ctx: Context,
    user: User,
  ): Promise<
    | UserCreatedResponse
    | UserExistsResponse
    | InvalidUserResponse
    | Standard4XxResponse
    | Standard5XxResponse
  >;
}
```

An object implementing this `Users` interface must be passed to the router when it is created. The `Context` type
parameter represents the underlying protocol or framework-specific context that the service implementation may inspect.
If you need to access the HTTP request or response objects directly in the implementation of the service methods, you
must use the `HttpContext` type as the `Context` argument when implementing the service interface. Otherwise, it is safe
to use the default `unknown` argument.

```ts
import { HttpContext } from "../tsp-output/@typespec/http-server-javascript/helpers/router.js";
import { Users } from "../tsp-output/@typespec/http-server-javascript/models/all/todo/index.js";

export const users: Users<HttpContext> = {
  async create(ctx, user) {
    // Implementation
  },
};
```

### Models

The emitter generates TypeScript interfaces that represent the model types used in the service operations. This allows
the service implementation to interact with the data structures carried over the HTTP protocol in a type-safe manner.

### Operation functions

While your code should never need to interact with these functions directly, the emitter generates a function per HTTP
operation that handles the parsing and validation of the request contents. This allows the service implementation to be
written in terms of ordinary TypeScript types and values rather than raw HTTP request and response objects. In general:

- The Node.js HTTP server or Express.js application (your code) calls the router (generated code), which determines
  which service operation function (generated code) to call based on the route, method, and other HTTP metadata in the
  case of shared routes.
- The operation function (generated code) deserializes the request body, query parameters, and headers into TypeScript
  types, and may perform request validation.
- The operation function (generated code) calls the service implementation (your code) with the deserialized request
  data.
- The service implementation (your code) returns a result or throws an error.
- The operation function (generated code) responds to the HTTP request on your behalf, converting the result or error
  into HTTP response data.
