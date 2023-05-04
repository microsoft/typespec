# TypeSpec HTTP Library

This package provides [TypeSpec](https://github.com/microsoft/TypeSpec) decorators, models, and interfaces to describe HTTP APIs. With fundamental models and decorators defined in TypeSpec.Http namespace, you will be able describe basic http level operations.

## Install

In your typespec project root

```bash
npm install @typespec/http
```

## Usage

```TypeSpec
import "@typespec/http";

using TypeSpec.Http;
```

For more information, consult the [HTTP](https://microsoft.github.io/typespec/docs/standard-library/http/) section of the TypeSpec guide.

## Library Tour

`@typespec/http` library defines of the following artifacts:

- [TypeSpec HTTP Library](#typespec-http-library)
  - [Install](#install)
  - [Usage](#usage)
  - [Library Tour](#library-tour)
  - [Models](#models)
  - [Decorators](#decorators)
  - [See also](#see-also)

## Models

| Model                        | Notes                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| LocationHeader               | Location header                                                                                                                        |
| Response&lt;Status>          | &lt;Status> is numerical status code.                                                                                                  |
| OkResponse&lt;T>             | Response&lt;200> with T as the response body model type.                                                                               |
| CreatedResponse              | Response&lt;201>                                                                                                                       |
| AcceptedResponse             | Response&lt;202>                                                                                                                       |
| NoContentResponse            | Response&lt;204>                                                                                                                       |
| MovedResponse                | Response&lt;301> with LocationHeader for redirected URL                                                                                |
| NotModifiedResponse          | Response&lt;304>                                                                                                                       |
| UnauthorizedResponse         | Response&lt;401>                                                                                                                       |
| NotFoundResponse             | Response&lt;404>                                                                                                                       |
| ConflictResponse             | Response&lt;409>                                                                                                                       |
| PlainData&lt;T>              | Produces a new model with the same properties as T, but with @query, @header, @body, and @path decorators removed from all properties. |
| BasicAuth                    | Configure `basic` authentication with @useAuth                                                                                         |
| BearerAuth                   | Configure `bearer` authentication with @useAuth                                                                                        |
| ApiKeyAuth<TLocation, TName> | Configure `apiKey` authentication with @useAuth                                                                                        |
| OAuth2Auth<TFlows>           | Configure `oauth2` authentication with @useAuth                                                                                        |

## Decorators

The `@typespec/http` library defines the following decorators in `TypeSpec.Http` namespace:

| Declarator  | Scope                                     | Usage                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| @get        | operations                                | indicating operation uses HTTP `GET` verb.                                                                                                                                                                                                                                                                                                                                                     |
| @put        | operations                                | indicating operation uses HTTP `PUT` verb.                                                                                                                                                                                                                                                                                                                                                     |
| @post       | operations                                | indicating operation uses HTTP `POST` verb.                                                                                                                                                                                                                                                                                                                                                    |
| @patch      | operations                                | indicating operation uses HTTP `PATCH` verb.                                                                                                                                                                                                                                                                                                                                                   |
| @delete     | operations                                | indicating operation uses HTTP `DEL` verb.                                                                                                                                                                                                                                                                                                                                                     |
| @head       | operations                                | indicating operation uses HTTP `HEAD` verb.                                                                                                                                                                                                                                                                                                                                                    |
| @header     | model properties and operation parameters | indicating the properties are request or response headers.                                                                                                                                                                                                                                                                                                                                     |
| @query      | model properties and operation parameters | indicating the properties are in the request query string.                                                                                                                                                                                                                                                                                                                                     |
| @body       | model properties and operation parameters | indicating the property is in request or response body. Only one allowed per model and operation.                                                                                                                                                                                                                                                                                              |
| @path       | model properties and operation parameters | indicating the properties are in request path.                                                                                                                                                                                                                                                                                                                                                 |
| @statusCode | model properties and operation parameters | indicating the property is the return status code. Only one allowed per model.                                                                                                                                                                                                                                                                                                                 |
| @server     | namespace                                 | Configure the server url for the service.                                                                                                                                                                                                                                                                                                                                                      |
| @route      | operations, namespaces, interfaces        | Syntax:<br> `@route(routeString)`<br><br>Note:<br>`@route` defines the relative route URI for the target operation. The `routeString` argument should be a URI fragment that may contain one or more path parameter fields. If the namespace or interface that contains the operation is also marked with a `@route` decorator, it will be used as a prefix to the route URI of the operation. |
| @useAuth    | namespace                                 | Configure the service authentication.                                                                                                                                                                                                                                                                                                                                                          |

## How to

### Specify content type

To specify the content type you can add a `@header contentType: <value>` in the operation parameter(For request content type) or return type(For response content type)

Example: return `application/png` byte body

```typespec
op getPng(): {
  @header contentType: "application/png";
  @body _: bytes;
};
```

Example: expect `application/png` byte body

```typespec
op getPng(@header contentType: "application/png", @body _: bytes): void;
```

## See also

- [HTTP example](https://cadlplayground.z22.web.core.windows.net/?c=aW1wb3J0ICJAY2FkbC1sYW5nL3Jlc3QiOwoKQHNlcnZpY2VUaXRsZSgiV2lkZ2V0IFPGFSIpCm5hbWVzcGFjZSBEZW1vxxg7CnVzaW5nIENhZGwuSHR0cDsKCm1vZGVsIMdAewogIEBrZXkgaWQ6IHN0cmluZzsKICB3ZWlnaHQ6IGludDMyxBFjb2xvcjogInJlZCIgfCAiYmx1ZSI7Cn0KCkBlcnJvcsdWRcQMxVVjb2Rly0BtZXNzYWdlymR9CgppbnRlcmbkALLmAI3nALTFP0DkAJ1saXN0KCk6xx9bXSB8xmHEUUByb3V0ZSgid8Uccy97aWR9IinGOHJlYWQoQHBhdGjrANfJSM1GcG9zdCBjcmVhdGUoQGJvZHkgxAXIK9Y0x3pjdXN0b21HZXTId8kR6gC0yjh9Cg%3D%3D):
- [TypeSpec Getting Started](https://github.com/microsoft/typespec#getting-started)
- [TypeSpec Website](https://microsoft.github.io/typespec)

```

```
