# Cadl HTTP/Rest Library

This package provides [Cadl](htps://github.com/microsoft/Cadl) decorators to describe HTTP and REST API.

## Install

In your cadl project root

```bash
npm install @cadl-lang/rest
```

## Usage

```Cadl
import "@cadl-lang/rest";

using Cadl.Http;
using Cadl.Rest;
```

See [Rest section in the tutorial](../../docs/tutorial.md#rest-apis)

## Library Tour

`@cadl-lang/rest` library defines of the following artifacts:

- [Models](#Models)
- [Decorators](#Decorators)
- [Types](#Types)
- [Interfaces](#Interfaces)

## Models

- ### HTTP namespace
  | Model                                                                | Notes                                                                |
  | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
  | Response<Status>                                                     | <Status> is numerical status code.                                   |
  | OkResponse<T>                                                        | Response<200> with T as the response body model type.                |
  | LocationHeader                                                       | Location header                                                      |
  | CreatedResponse                                                      | Response<201>                                                        |
  | AcceptedResponse                                                     | Response<202>                                                        |
  | NoContentResponse                                                    | Response<204>                                                        |
  | MovedResponse                                                        | Response<301> with LocationHeader for redirected URL                 |
  | NotModifiedResponse                                                  | Response<304>                                                        |
  | UnauthorizedResponse                                                 | Response<401>                                                        |
  | NotFoundResponse                                                     | Response<404>                                                        |
  | ConflictResponse                                                     | Response<409>                                                        |
  | PlainData<T>                                                         | Produces a new model with the same properties as T, but with @query, |
  | // @header, @body, and @path decorators removed from all properties. |
- ### REST namespace
  | Model                                   | Notes |
  | --------------------------------------- | ----- |
  | ResourceError                           |       |
  | KeysOf<T>                               |       |
  | ParentKeysOf<T>                         |       |
  | ResourceParameters<TResource>           |       |
  | ResourceCollectionParameters<TResource> |       |
  | ResourceCreatedResponse<T>              |       |
  | ResourceCreateOrUpdateModel<TResource>  |       |
  | ResourceCreateModel<TResource>          |       |
  | ResourceDeletedResponse                 |       |
  | Page<T>                                 |       |

## Types

- ### HTTP namespace
  | Interface                    | Notes |
  | ---------------------------- | ----- |
  | HttpServer                   |       |
  | HttpOperationResponse        |       |
  | HttpOperationResponseContent |       |
  | HttpOperationResponseBody    |       |
- ### REST namespace

## Decorators

- ### HTTP namespace

The `@cadl-lang/rest` library defines the following decorators in `Cadl.Http` namespace:

| Declarator  | Scope                                     | Usage                                                                                             |
| ----------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| @get        | operations                                | indicating operation uses HTTP `GET` verb.                                                        |
| @put        | operations                                | indicating operation uses HTTP `PUT` verb.                                                        |
| @post       | operations                                | indicating operation uses HTTP `POST` verb.                                                       |
| @patch      | operations                                | indicating operation uses HTTP `PATCH` verb.                                                      |
| @delete     | operations                                | indicating operation uses HTTP `DEL` verb.                                                        |
| @head       | operations                                | indicating operation uses HTTP `HEAD` verb.                                                       |
| @header     | model properties and operation parameters | indicating the properties are request or response headers.                                        |
| @query      | model properties and operation parameters | indicating the properties are in the request query string.                                        |
| @body       | model properties and operation parameters | indicating the property is in request or response body. Only one allowed per model and operation. |
| @path       | model properties and operation parameters | indicating the properties are in request path.                                                    |
| @statusCode | model properties and operation parameters | indicating the property is the return status code. Only one allowed per model.                    |
| @server     | namespace                                 | Configure the server url for the service.                                                         |

- ### REST namespace

The `@cadl-lang/rest` library defines the following decorators in `Cadl.Rest` namespace:

| Declarator                 | Scope            |
| -------------------------- | ---------------- |
| @produces                  | operations       |
| @consumes                  | operations       |
| @discriminator             | models           |
| @segmentOf                 | models           |
| @segmentSeparator          | models           |
| @readsResource             | models           |
| @createsResource           | models           |
| @createsOrUpdatesResource( | models           |
| @updatesResource           | models           |
| @deletesResource           | models           |
| @listsResource             | models           |
| @parentResource            | models           |
| @segment                   | model properties |
| @route                     | models           |
| @autoRoute                 | models           |

#### `@parentResource`

Syntax:

```
@parentResource(parentModelTypeReference)
```

`@parentResource` marks a model property with a reference to its parent resource type

The first argument should be a reference to a model type which will be treated as the parent
type of the target model type. This will cause the `@key` properties of all parent types of
the target type to show up in operations of the `Resource*<T>` interfaces defined in this library.

`@parentResource` can only be applied to models.

#### `@segment`

Syntax:

```
@segment(segmentString)
```

`@segment` defines the preceding path segment for a `@path` parameter in auto-generated routes

The first argument should be a string that will be inserted into the operation route before the
path parameter's name field. For example:

```
op getUser(
  @path
  @segment("users")
  userId: string
): User
```

Would produce the route `/users/{userId}`.

`@segment` can only be applied to model properties or operation parameters.

#### `@route`

Syntax:

```
@route(routeString)
```

`@route` defines the relative route URI for the target operation

The first argument should be a URI fragment that may contain one or more path parameter fields.
If the namespace or interface that contains the operation is also marked with a `@route` decorator,
it will be used as a prefix to the route URI of the operation.

`@route` can only be applied to operations, namespaces, and interfaces.

#### `@autoRoute`

Syntax:

```
@autoRoute()
```

`@autoRoute` enables automatic route generation for an operation, namespace, or interface.

When applied to an operation, it automatically generates the operation's route based on path parameter
metadata. When applied to a namespace or interface, it causes all operations under that scope to have
auto-generated routes.

## Interfaces

- ### HTTP namespace
  None
- ### REST namespace
  | Interfaces                                                           | Notes                                                                                          |
  | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
  | ResourceRead<TResource, TError>                                      | Resource GET operation                                                                         |
  | ResourceCreateOrUpdate<TResource, TError>                            | Resource PUT operation                                                                         |
  | ResourceCreate<TResource, TError>                                    | Resource POST operation                                                                        |
  | ResourceUpdate<TResource, TError>                                    | Resource PATCH operation                                                                       |
  | ResourceDelete<TResource, TError>                                    | Resource DEL operation                                                                         |
  | ResourceList<TResource, TError>                                      | Resource LIST operation which is a GET operation from a parent resource.                       |
  | ResourceInstanceOperations<TResource, TError>                        | Combines resource GET + PATCH + DEL operations                                                 |
  | ResourceCollectionOperations<TResource, TError>                      | Combines resource POST + LIST operations                                                       |
  | ResourceOperations<TResource, TError>                                | Combines resource instance and collection operations. Includes GET + PATCH + DEL + POST + LIST |
  | SingletonResourceRead<TSingleton, TResource, TError>                 |                                                                                                |
  | SingletonResourceUpdate<TSingleton, TResource, TError>               |                                                                                                |
  | SingletonResourceOperations<TSingleton, TResource, TError>           |                                                                                                |
  | ExtensionResourceRead<TExtension, TResource, TError>                 |                                                                                                |
  | ExtensionResourceCreateOrUpdate<TExtension, TResource, TError>       |                                                                                                |
  | ExtensionResourceCreate<TExtension, TResource, TError>               |                                                                                                |
  | ExtensionResourceUpdate<TExtension, TResource, TError>               |                                                                                                |
  | ExtensionResourceDelete<TExtension, TResource, TError>               |                                                                                                |
  | ExtensionResourceList<TExtension, TResource, TError>                 |                                                                                                |
  | ExtensionResourceInstanceOperations<TExtension, TResource, TError>   |                                                                                                |
  | ExtensionResourceCollectionOperations<TExtension, TResource, TError> |                                                                                                |
  | ExtensionResourceOperations<TExtension, TResource, TError>           |                                                                                                |

## See also

- [HTTP example](https://cadlplayground.z22.web.core.windows.net/?c=aW1wb3J0ICJAY2FkbC1sYW5nL3Jlc3QiOwoKQHNlcnZpY2VUaXRsZSgiV2lkZ2V0IFPGFSIpCm5hbWVzcGFjZSBEZW1vxxg7CnVzaW5nIENhZGwuSHR0cDsKCm1vZGVsIMdAewogIEBrZXkgaWQ6IHN0cmluZzsKICB3ZWlnaHQ6IGludDMyxBFjb2xvcjogInJlZCIgfCAiYmx1ZSI7Cn0KCkBlcnJvcsdWRcQMxVVjb2Rly0BtZXNzYWdlymR9CgppbnRlcmbkALLmAI3nALTFP0DkAJ1saXN0KCk6xx9bXSB8xmHEUUByb3V0ZSgid8Uccy97aWR9IinGOHJlYWQoQHBhdGjrANfJSM1GcG9zdCBjcmVhdGUoQGJvZHkgxAXIK9Y0x3pjdXN0b21HZXTId8kR6gC0yjh9Cg%3D%3D):
- [REST example](https://cadlplayground.z22.web.core.windows.net/?c=aW1wb3J0ICJAY2FkbC1sYW5nL3Jlc3QiOwoKQHNlcnZpY2VUaXRsZSgiV2lkZ2V0IFPGFSIpCm5hbWVzcGFjZSBEZW1vxxg7Cgp1c2luZyBDYWRsLkh0dHA7zBFSZXN0OwoKbW9kZWwgx1J7CiAgQGtleSBpZDogc3RyaW5nOwogIHdlaWdodDogaW50MzLEEWNvbG9yOiAicmVkIiB8ICJibHVlIjsKfQoKQGVycm9yx1ZFxAzFVWNvZGXLQG1lc3NhZ2XKZH0KCmludGVyZuQAxOYAjecAxiBleHRlbmRzIFJlc291cmNl5AC5xQlPcGVyYXRpb25zPMYyLMZxPsVyQOQA0EByb3V0ZSgiY3VzdG9tR2V0IikgyQwoKTrHa%2BQAgA%3D%3D):
- [Cadl Getting Started](https://github.com/microsoft/cadl#getting-started)
- [Cadl Tutorial](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md)
