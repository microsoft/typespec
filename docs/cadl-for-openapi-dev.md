# Cadl for the OpenAPI developer

This guide is an introduction to Cadl using concepts that will be familiar to developers
that either build or use API definitions in OpenAPI v2 or v3.

In many case, this will also describe how the cadl-autorest and openapi3 emitters translate
Cadl designs into OpenAPI.

The document is organized around the features of an OpenAPI v2 or v3 definition.
The idea is that if you know how to describe some API feature in OpenAPI, you can just navigate
to the section of this document for that feature.

## Data Types

In OpenAPI [v2](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#data-types)/[v3](https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#dataTypes), data types are specified using the `type` and `format` fields in a schema.

The Cadl equivalent of OpenAPI data types are the Cadl primitive types or [built-in models](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md#built-in-models).

The following table shows how common OpenAPI types map to Cadl types:

| OpenAPI `type`/`format`           | Cadl type        | Notes                                                                     |
| --------------------------------- | ---------------- | ------------------------------------------------------------------------- |
| `type: integer, format: int32`    | `int32`          |                                                                           |
| `type: integer, format: int64`    | `int64`          |                                                                           |
| `type: number, format: float`     | `float32`        |                                                                           |
| `type: number, format: double`    | `float64`        |                                                                           |
| `type: string`                    | `string`         |                                                                           |
| `type: string, format: byte`      | `bytes`          | for content-type == 'application/json' or 'text/plain'                    |
| `type: string, format: binary`    | `bytes`          | for "binary" content types, e.g. 'application/octet-stream', 'image/jpeg' |
| `type: boolean`                   | `boolean`        |                                                                           |
| `type: string, format: date`      | `plainDate`      |                                                                           |
| `type: string, format: date-time` | `zonedDateTime`  | RFC 3339 date                                                             |
| `type: string, format: password`  | `@secret string` |                                                                           |

OpenAPI supports a variety of "assertions" that can be used further restrict the values allowed for a data type.
These are actually borrowed into OpenAPI from JSON Schema.

For `type: integer` and `type: number` data types:

| OpenAPI/JSON Schema keyword | Cadl construct               | Notes |
| --------------------------- | ---------------------------- | ----- |
| `minimum: value`            | `@minValue(value)` decorator |       |
| `maximum: value`            | `@maxValue(value)` decorator |       |

For `type: string` data types:

| OpenAPI/JSON Schema keyword | Cadl construct                | Notes |
| --------------------------- | ----------------------------- | ----- |
| `minLength: value`          | `@minLength(value)` decorator |       |
| `maxLength: value`          | `@maxLength(value)` decorator |       |
| `pattern: regex`            | `@pattern(regex)` decorator   |       |

There are two ways to define an `enum` data type. One is with the [Cadl `enum` statement](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md#enums), e.g.:

```cadl
enum Color {
  Red: "red",
  Blue: "blue",
  Green: "green",
}

```

Another is to use the union operation to define the enum values inline, e.g.:

```cadl
status: "Running" | "Stopped" | "Failed"
```

## Host / BasePath / Servers

In OpenAPI v2, the `host` and `basePath` fields at the top-level of the API definition combine to form the base URL for the API. The paths defined in the `paths` object are appended to this base URL to form the absolute URL for an operation.

In OpenAPI v3, the top-level `servers` field specifies an array of `server` objects [[v3][v3-server]] with a base URL, which may be parameterized, to which the operation path can be appended.

[v3-server]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#server-object

There is also an autorest extension used in many Azure API definitions called [`x-ms-parameterized-host`](https://github.com/Azure/autorest/tree/main/docs/extensions#x-ms-parameterized-host) to define the base URL for the service.

In Cadl, the `host` in OpenAPI v2 can be specified with the `@serviceHost` decorator on the namespace. Similar support will be added to the openapi3 emitter shortly.

There is currently no mechanism to specify `basePath` so all paths in the path object must derive directly from the `@serviceHost` value.

## Paths Object

In OpenAPI, the `paths` object [[v2][v2-paths], [v3][v3-paths]] is the top-level structure for defining the operations of the API, organized with the "path" for the operation.

[v2-paths]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#paths-object
[v3-paths]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#paths-object

In Cadl, a path is associated with a `namespace` using the `@route` decorator. Then all operations within the namespace use this path, plus any path parameters an operation may define.

```cadl
@route("/pets")
namespace Pets {
  op create(@body pet: Pet): Pet; // uses path "/pets"
  op read(@path petId: int32): Pet; // uses path "/pets/{petId}"
}

```

## Path Item Object

In OpenAPI, a path item object [[v2][v2-pathitem], [v3][v3-pathitem]] describes the operations available on a single path. A path may have at most one `get`, `put`, `post`, `patch`, `delete`, or `head` operation.

[v2-pathitem]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#pathItemObject
[v3-pathitem]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#pathItemObject

In Cadl, operations are defined within a namespace with a syntax very similar to typescript functions.
The http method for an operation can be specified explicitly using a decorator: `@get`, `@put`, `@post`, `@patch`, `@delete`, or `@head`.
But a namespace may contain operations for a set of related paths (depending on path parameters), and so may have multiple operations that use a particular HTTP method.
The http method decorators also accept an explicit path, which is appended to the namespace path.

```cadl
@route("/pets")
namespace Pets {
  @get op list(): Pet[]; // get on path "/pets"
  @get op read(@path petId: int32): Pet; // get on path "/pets/{petId}"
  @post
  @route("{petId}:walk")
  op walk(... PetId): ; // post on path "/pets/{petId}:walk"
}

```

## Operation Object

In OpenAPI, an operation object [[v2][v2-operation], [v3][v3-operation]] describes an operation.

[v2-operation]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#operationObject
[v3-operation]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#operationObject

The fields in an OpenAPI operation object are specified with the following Cadl constructs:

| OpenAPI `operation` field | Cadl construct           | Notes                                     |
| ------------------------- | ------------------------ | ----------------------------------------- |
| `description`             | `@doc` decorator         |                                           |
| `operationId`             | `@operationId` decorator |                                           |
| `parameters`              | `op` parameter list      | see [Parameter Object](#parameter-object) |
| `responses`               | `op` return type(s)      | see [Responses Object](#responses-object) |
| `tags`                    | `@tag` decorator         |                                           |
| `consumes`                | `@header contentType`    | as a union (enum) of the MIME types       |
| `produces`                | `@header accept`         | as a union (enum) of the MIME types       |
| `summary`                 |                          | Not currently supported.                  |
| `security`                |                          | Not currently supported.                  |

## Parameter Object

In OpenAPI, a parameter object [[v2][v2-parameter], [v3][v3-parameter]] describes a single operation parameter.

[v2-parameter]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#parameter-object
[v3-parameter]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#parameterObject

The fields of a parameter object correspond to the following Cadl constructs:

<!-- prettier-ignore-start -->

| OpenAPI `parameter` field | Cadl construct   | Notes                                 |
| ------------------------- | ---------------- | ------------------------------------- |
| `name`                    | parameter name   |                                       |
| `in`                      | decorator        | `@query`, `@path`, `@header`, `@body` |
| `type`                    | parameter type   | see [Data Types](#data-types)         |
| `description`             | `@doc` decorator |                                       |
| `required`                | from parameter "optionality" | a "?" following the parameter name indicates it is optional (`required: false`), otherwise it is required (`required: true`) |
| `deprecated`              |                  | Not currently supported.              |
| `allowEmptyValue`         |                  | Not currently supported.              |
| `collectionFormat`        |                  | Not currently supported.              |
<!-- prettier-ignore-end -->

## RequestBody Object (OAS3)

In OpenAPI v3, the operation request body is defined with a `requestBody` object rather than as a parameter.

An OpenAPI v3 `requestBody` corresponds to a Cadl `op` parameter with the `@body` decorator.

## Responses Object

In OpenAPI, the responses object [[v2][v2-responses], [v3][v3-responses]] specifies the possible responses for an operation.
The responses object maps a HTTP response code to the expected response.

[v2-responses]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#responsesObject
[v3-responses]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#responsesObject

In Cadl, operation responses are defined by the return types of the `op`. The status code for a response can be specified as a property in the return type with the `@statusCode` decorator (the property name is ignored). The Cadl.Http package also defines several standard response types:

| OpenAPI response | Cadl construct         | Notes                                |
| ---------------- | ---------------------- | ------------------------------------ |
| `200`            | `OkResponse<T>`        | `T` specifies the response body type |
| `201`            | `CreatedResponse`      | Probably should have `T` parameter   |
| `202`            | `AcceptedResponse`     |                                      |
| `204`            | `NoContentResponse`    |                                      |
| `301`            | `MovedResponse`        |                                      |
| `304`            | `NotModifiedResponse`  |                                      |
| `401`            | `UnauthorizedResponse` |                                      |
| `404`            | `NotFoundResponse`     |                                      |
| `409`            | `ConflictResponse`     |                                      |

If a return type does not contain a `statusCode`, it is assumed to be the `200` response.

### Response Object

In OpenAPI, a response object [[v2][v2-response], [v3][v3-response]] describes a single response for an operation.
The structure of the response object changed significantly from OpenAPI v2 to OpenAPI v3, but there are many
elements common to both.

[v2-response]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#responseObject
[v3-response]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#responseObject

The fields in an OpenAPI response object are specified with the following Cadl constructs:

| OpenAPI `response` field | Cadl construct                                     | Notes                    |
| ------------------------ | -------------------------------------------------- | ------------------------ |
| `description`            | `@doc` decorator                                   |                          |
| `schema`                 | return type                                        |                          |
| `headers`                | fields in the return type with `@header` decorator |                          |
| `examples`               |                                                    | Not currently supported. |
| `links` (OAS3)           |                                                    | Not currently supported. |

## Schema Object

OpenAPI schemas are represented in Cadl by [models](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md#models).
Models have any number of members and can extend and be composed with other models.

Models can be defined with the `model` statement and then referenced by name, which generally results in a `$ref` to a schema for the model in the `definitions` or `components.schemas` section of the OpenAPI document.

Cadl supports the ["spread" operator](https://github.com/microsoft/cadl/blob/main/docs/tutorial.md#spread) (`...`), which copies the members of the source model into the target model.
But Cadl processes all spread transformations before emitters are invoked, so this form of reuse is not represented in the emitted OpenAPI.

The spread operation is useful if you want one or more properties to be present in several different models but in a standard fashion. For example:

```cadl
model Legs {
  @doc("number of legs") legs: int32;
}

model Dog {
  name: string;
  ...Legs;
}

model Cat {
  name: string;
  ...Legs;
}

model Snake {
  name: string;
  // snakes have no legs
}

```

Cadl also supports single inheritance of models with the `extends` keyword. This construct can be used to produce an `allOf` with a single element (the parent schema) in OpenAPI. For example:

```cadl
model Pet {
  name: string;
}

model Cat extends Pet {
  meow: int32;
}

model Dog extends Pet {
  bark: string;
}

```

Cadl does not current provide a means to produce an `allOf` with more than one element -- these are generally treated as "composition" in code generators and thus better represented in Cadl with the spread operator.

Cadl does not yet support a means to specify an OpenAPI `discriminator` but this support is currently in development.

## definitions / components

OpenAPI supports reuse of schemas, parameters, responses, and other elements with the `definitions` (OAS2) or `components` (OAS3) section of an OpenAPI definition.

Referencing a model by name (not with "spread"), as an `op` parameter or return type or as the type of a property in another model, generally results in a `$ref` to a schema for the model in the `definitions` or `components.schemas` section of the OpenAPI document.

Reusable parameters can be defined as members of a model and then incorporated into an operation parameter list using the spread operator. For example:

```cadl
model PetId {
  @path petId: int32;
}

namespace Pets {
  op read(...PetId): Pet | Error;
}

```

results in a `$ref` to the named parameter `PetId` in either `parameters` or `components.parameters`.

## Info Object

In OpenAPI, the `info` object [[v2][v2-info], [v3][v3-info]] contains metadata about the API such as a `title`, `description`, `license`, and `version`.

[v2-info]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#infoObject
[v3-info]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#infoObject

In Cadl this information is specified with [decorators on the namespace][cadl-service-metadata].

| OpenAPI `info` field | Cadl decorator    | Notes                    |
| -------------------- | ----------------- | ------------------------ |
| `title`              | `@serviceTitle`   |                          |
| `version`            | `@serviceVersion` |                          |
| `description`        |                   | Not currently supported. |
| `license`            |                   | Not currently supported. |
| `contact`            |                   | Not currently supported. |

[cadl-service-metadata]: https://github.com/microsoft/cadl/blob/main/docs/tutorial.md#service-definition-and-metadata

## Consumes / Produces (OAS2)

In OpenAPI v2, the top-level `consumes` and `produces` fields specify a list of MIME types an operation can consume / produce
when not overridden by a `consumes` or `produces` on an individual operation.

The cadl-autorest emitter previously supported `@produces` and `@consumes` decorators on a namespace, but these are deprecated
in favor of explicit `content-type` and `accept` header properties in request and response bodies.

## securityDefinitions / securitySchemes Object

In Cadl, these fields are currently set using javascript that is imported into the Cadl definition. In the near future there will likely be decorators that allow some of these elements to be set directly from Cadl.

## Specification Extensions

You can add arbitrary specification extensions ("x-" properties) to a model or an operation with the `@extension` decorator.
For example:

```cadl
namespace Pets {
  @extension("x-streaming-operation", true) op read(...PetId): Pet | Error;
}

```
