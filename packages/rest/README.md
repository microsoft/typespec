# Cadl HTTP/Rest Library

This package provides [Cadl](htps://github.com/microsoft/Cadl) decorators, models, and interfaces to describe HTTP and REST API. With fundamental models and decorators defined in Cadl.Http namespace, you will be able describe basic http level operations. Cadl.Rest namespace adds additional predefined models and interfaces. These building blocks make defining REST resources and operations based on standard patterns extremely simple.

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
  | Model                | Notes                                                                                                                                  |
  | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
  | Response&lt;Status>  | <Status> is numerical status code.                                                                                                     |
  | OkResponse&lt;T>     | Response<200> with T as the response body model type.                                                                                  |
  | LocationHeader       | Location header                                                                                                                        |
  | CreatedResponse      | Response&lt;201>                                                                                                                       |
  | AcceptedResponse     | Response&lt;202>                                                                                                                       |
  | NoContentResponse    | Response&lt;204>                                                                                                                       |
  | MovedResponse        | Response<301> with LocationHeader for redirected URL                                                                                   |
  | NotModifiedResponse  | Response&lt;304>                                                                                                                       |
  | UnauthorizedResponse | Response&lt;401>                                                                                                                       |
  | NotFoundResponse     | Response&lt;404>                                                                                                                       |
  | ConflictResponse     | Response&lt;409>                                                                                                                       |
  | PlainData&lt;T>      | Produces a new model with the same properties as T, but with @query, @header, @body, and @path decorators removed from all properties. |
- ### REST namespace
  | Model                                      | Notes |
  | ------------------------------------------ | ----- |
  | ResourceError                              |       |
  | KeysOf&lt;T>                               |       |
  | ParentKeysOf&lt;T>                         |       |
  | ResourceParameters&lt;TResource>           |       |
  | ResourceCollectionParameters&lt;TResource> |       |
  | ResourceCreatedResponse&lt;T>              |       |
  | ResourceCreateOrUpdateModel&lt;TResource>  |       |
  | ResourceCreateModel&lt;TResource>          |       |
  | ResourceDeletedResponse                    |       |
  | Page&lt;T>                                 |       |

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
  | Interfaces                                                              | Notes                                                                                          |
  | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
  | ResourceRead&lt;TResource, TError>                                      | Resource GET operation                                                                         |
  | ResourceCreateOrUpdate&lt;TResource, TError>                            | Resource PUT operation                                                                         |
  | ResourceCreate&lt;TResource, TError>                                    | Resource POST operation                                                                        |
  | ResourceUpdate&lt;TResource, TError>                                    | Resource PATCH operation                                                                       |
  | ResourceDelete&lt;TResource, TError>                                    | Resource DEL operation                                                                         |
  | ResourceList&lt;TResource, TError>                                      | Resource LIST operation which is a GET operation from a parent resource.                       |
  | ResourceInstanceOperations&lt;TResource, TError>                        | Combines resource GET + PATCH + DEL operations                                                 |
  | ResourceCollectionOperations&lt;TResource, TError>                      | Combines resource POST + LIST operations                                                       |
  | ResourceOperations&lt;TResource, TError>                                | Combines resource instance and collection operations. Includes GET + PATCH + DEL + POST + LIST |
  | SingletonResourceRead&lt;TSingleton, TResource, TError>                 |                                                                                                |
  | SingletonResourceUpdate&lt;TSingleton, TResource, TError>               |                                                                                                |
  | SingletonResourceOperations&lt;TSingleton, TResource, TError>           |                                                                                                |
  | ExtensionResourceRead&lt;TExtension, TResource, TError>                 |                                                                                                |
  | ExtensionResourceCreateOrUpdate&lt;TExtension, TResource, TError>       |                                                                                                |
  | ExtensionResourceCreate&lt;TExtension, TResource, TError>               |                                                                                                |
  | ExtensionResourceUpdate&lt;TExtension, TResource, TError>               |                                                                                                |
  | ExtensionResourceDelete&lt;TExtension, TResource, TError>               |                                                                                                |
  | ExtensionResourceList&lt;TExtension, TResource, TError>                 |                                                                                                |
  | ExtensionResourceInstanceOperations&lt;TExtension, TResource, TError>   |                                                                                                |
  | ExtensionResourceCollectionOperations&lt;TExtension, TResource, TError> |                                                                                                |
  | ExtensionResourceOperations&lt;TExtension, TResource, TError>           |                                                                                                |

## See also

- [HTTP example](https://cadlplayground.z22.web.core.windows.net/?c=aW1wb3J0ICJAY2FkbC1sYW5nL3Jlc3QiOwoKQHNlcnZpY2VUaXRsZSgiV2lkZ2V0IFPGFSIpCm5hbWVzcGFjZSBEZW1vxxg7CnVzaW5nIENhZGwuSHR0cDsKCm1vZGVsIMdAewogIEBrZXkgaWQ6IHN0cmluZzsKICB3ZWlnaHQ6IGludDMyxBFjb2xvcjogInJlZCIgfCAiYmx1ZSI7Cn0KCkBlcnJvcsdWRcQMxVVjb2Rly0BtZXNzYWdlymR9CgppbnRlcmbkALLmAI3nALTFP0DkAJ1saXN0KCk6xx9bXSB8xmHEUUByb3V0ZSgid8Uccy97aWR9IinGOHJlYWQoQHBhdGjrANfJSM1GcG9zdCBjcmVhdGUoQGJvZHkgxAXIK9Y0x3pjdXN0b21HZXTId8kR6gC0yjh9Cg%3D%3D):
- [REST example](https://cadlplayground.z22.web.core.windows.net/?c=aW1wb3J0ICJAY2FkbC1sYW5nL3Jlc3QiOwoKQHNlcnZpY2VUaXRsZSgiV2lkZ2V0IFPGFSIpCm5hbWVzcGFjZSBEZW1vxxg7Cgp1c2luZyBDYWRsLkh0dHA7zBFSZXN0OwoKbW9kZWwgx1J7CiAgQGtleSBpZDogc3RyaW5nOwogIHdlaWdodDogaW50MzLEEWNvbG9yOiAicmVkIiB8ICJibHVlIjsKfQoKQGVycm9yx1ZFxAzFVWNvZGXLQG1lc3NhZ2XKZH0KCmludGVyZuQAxOYAjecAxiBleHRlbmRzIFJlc291cmNl5AC5xQlPcGVyYXRpb25zPMYyLMZxPsVyQOQA0EByb3V0ZSgiY3VzdG9tR2V0IikgyQwoKTrHa%2BQAgA%3D%3D):
- [Cadl Getting Started](https://github.com/microsoft/cadl#getting-started)
- [Cadl Tutorial](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md)
