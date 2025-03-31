---
title: TypeSpec for OpenAPI Developers
---

This guide introduces TypeSpec using concepts familiar to developers who build or use API definitions in OpenAPI v2 or v3.

In many cases, this will also describe how the typespec-autorest and openapi3 emitters translate
TypeSpec designs into OpenAPI.

The document is organized around the features of an OpenAPI v2 or v3 definition.
The idea is that if you know how to describe some API feature in OpenAPI, you can just navigate
to the section of this document for that feature.

## Data Types

In OpenAPI [v2](https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#data-types)/[v3](https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#data-types), data types are specified using the `type` and `format` fields in a schema.

The TypeSpec equivalents of OpenAPI data types are the TypeSpec primitive types or [built-in models](https://typespec.io/docs/language-basics/built-in-types).

### type and format

The following table shows how common OpenAPI types map to TypeSpec types:

| `type:`   | `format:`   | TypeSpec type    | Notes                                                                     |
| --------- | ----------- | ---------------- | ------------------------------------------------------------------------- |
| `integer` | `int32`     | `int32`          |                                                                           |
| `integer` | `int64`     | `int64`          |                                                                           |
| `number`  | `float`     | `float32`        |                                                                           |
| `number`  | `double`    | `float64`        |                                                                           |
| `string`  |             | `string`         |                                                                           |
| `string`  | `byte`      | `bytes`          | for content-type == 'application/json' or 'text/plain'                    |
| `string`  | `binary`    | `bytes`          | for "binary" content types, e.g. 'application/octet-stream', 'image/jpeg' |
| `string`  | `date`      | `plainDate`      |                                                                           |
| `string`  | `date-time` | `utcDateTime`    | RFC 3339 date in coordinated universal time (UTC)                         |
| `string`  | `date-time` | `offsetDateTime` | RFC 3339 date with offset                                                 |
| `string`  | `password`  | `@secret string` |                                                                           |
| `boolean` |             | `boolean`        |                                                                           |

You can also define a property with no type specified using the TypeSpec `unknown` type.

```typespec
model Example {
  /** This property has no `type` defined. */
  noType?: unknown;
}
```

OpenAPI allows any string as a format, and there is a [registry of common formats][Format Registry].
TypeSpec supports some of these directly.

[Format Registry]: https://spec.openapis.org/registry/format

| `type:`   | `format:`    | TypeSpec type | Notes |
| --------- | ------------ | ------------- | ----- |
| `number`  | `decimal`    | `decimal`     |       |
| `number`  | `double-int` | `safeint`     |       |
| `integer` | `int8`       | `int8`        |       |
| `integer` | `int16`      | `int16`       |       |
| `integer` | `uint8`      | `uint8`       |       |
| `string`  | `uri`        | `url`         |       |

For formats that are not supported directly, you can use the built-in `@format` decorator to specify
the format explicitly.

### JSON Schema assertions

OpenAPI supports a variety of "assertions" that can be used to further restrict the values allowed for a data type.
These are actually borrowed into OpenAPI from JSON Schema.

For `type: integer` and `type: number` data types:

| OpenAPI/JSON Schema keyword | TypeSpec construct           | Notes |
| --------------------------- | ---------------------------- | ----- |
| `minimum: value`            | `@minValue(value)` decorator |       |
| `maximum: value`            | `@maxValue(value)` decorator |       |

For `type: string` data types:

| OpenAPI/JSON Schema keyword | TypeSpec construct            | Notes |
| --------------------------- | ----------------------------- | ----- |
| `minLength: value`          | `@minLength(value)` decorator |       |
| `maxLength: value`          | `@maxLength(value)` decorator |       |
| `pattern: regex`            | `@pattern(regex)` decorator   |       |

For `type: array` data types:

| OpenAPI/JSON Schema keyword | TypeSpec construct           | Notes |
| --------------------------- | ---------------------------- | ----- |
| `minItems: value`           | `@minItems(value)` decorator |       |
| `maxItems: value`           | `@maxItems(value)` decorator |       |

### enum

There are two ways to define an `enum` data type in TypeSpec. One is with the [TypeSpec `enum` statement](https://typespec.io/docs/language-basics/enums), e.g.:

<!-- To retain the quotes from the enum values -->
<!-- prettier-ignore-start -->
```typespec
enum Color {
  "red",
  "blue",
  "green",
}
```
<!-- prettier-ignore-end -->

Another is to use the union operation to define the enum values inline, e.g.:

```typespec
model Example {
  size?: "small" | "medium" | "large" | "x-large";
}
```

### default

A model property that specifies a default value using "=" will produce a `default` field in the schema for this property.

```typespec
model Example {
  answer?: int32 = 42;
  color?: string = "purple";
}
```

produces

```yaml title=openapi.yaml
answer:
  type: integer
  format: int32
  default: 42
color:
  type: string
  default: purple
```

## Host / BasePath / Servers

In OpenAPI v2, the `host` and `basePath` fields at the top-level of the API definition combine to form the base URL for the API. The paths defined in the `paths` object are appended to this base URL to form the absolute URL for an operation.

In OpenAPI v3, the top-level `servers` field specifies an array of `server` objects [[v3][v3-server]] with a base URL, which may be parameterized, to which the operation path is appended.

[v3-server]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#server-object

In TypeSpec, the `host` in OpenAPI v2 or `servers` in OpenAPI v3 can be specified with the `@server` decorator
on the namespace (from `@typespec/http` library). You can use this decorator multiple times to specify multiple servers.

## Paths Object

In OpenAPI, the `paths` object [[v2][v2-paths], [v3][v3-paths]] is the top-level structure for defining the operations of the API, organized by the "path" for the operation.

[v2-paths]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#paths-object
[v3-paths]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#paths-object

In TypeSpec, you can specify the path for a namespace, interface, or operation using the `@route` decorator.

When the value of the `@route` decorator contains path parameters, operations within the scope of the decorator
must declare parameters with the same name and type. If an operation declares a path parameter that is not present
in the route, this defines a new path that is the value from the `@route` decorator with the path parameter appended.

```typespec
@route("/pets")
namespace Pets {
  op create(@body pet: Pet): Pet; // uses path "/pets"
  op read(@path petId: int32): Pet; // uses path "/pets/{petId}"
}
```

When the `@route` decorator is used within a namespace or interface that also has a `@route` decorator, the path is
obtained by concatenating the routes.

```typespec
@route("/widgets")
namespace Widgets {
  // widgets operations

  @route("/{id}/parts")
  namespace Parts {
    op list(@path id: string): Part[] | Error; // uses path "/widgets/{id}/parts"
  }
}
```

## Path Item Object

In OpenAPI, a path item object [[v2][v2-pathitem], [v3][v3-pathitem]] describes the operations available on a single path. A path may have at most one `get`, `put`, `post`, `patch`, `delete`, or `head` operation.

[v2-pathitem]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#path-item-object
[v3-pathitem]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#path-item-object

In TypeSpec, operations are defined within a namespace or interface with a syntax similar to typescript functions.
The HTTP method for an operation can be specified explicitly using a decorator: `@get`, `@put`, `@post`, `@patch`, `@delete`, or `@head`.
If an HTTP method decorator is not specified then the default is `post` if there is a body and `get` otherwise.

```typespec
@tag("Gadgets")
@route("/gadgets")
namespace Gadgets {
  op create(@body gadget: Gadget): Gadget | Error; // uses "post" method
  op read(@path id: string): Gadget | Error; // uses "get" method
}
```

Other path item fields:

| OpenAPI `pathItem` field | TypeSpec construct | Notes                    |
| ------------------------ | ------------------ | ------------------------ |
| `summary`                |                    | Not currently supported. |
| `description`            |                    | Not currently supported. |
| `parameters`             |                    | Not currently supported. |

## Operation Object

In OpenAPI, an operation object [[v2][v2-operation], [v3][v3-operation]] describes an operation.

[v2-operation]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#operation-object
[v3-operation]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#operation-object

The fields in an OpenAPI operation object are specified with the following TypeSpec constructs:

| OpenAPI `operation` field | TypeSpec construct                         | Notes                                                                        |
| ------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------- |
| `tags`                    | `@tag` decorator                           |                                                                              |
| `summary`                 | `@summary` decorator                       |                                                                              |
| `description`             | `@doc` decorator or doc comment            |                                                                              |
| `externalDocs`            | `@externalDocs` decorator                  |                                                                              |
| `operationId`             | operation name or `@operationId` decorator |                                                                              |
| `parameters`              | `op` parameter list                        | see [Parameter Object](#parameter-object)                                    |
| `requestBody`             | parameter with `@body` decorator           | see [Request Body Object](#request-body-object-oas3)                         |
| `responses`               | `op` return type(s)                        | see [Responses Object](#responses-object)                                    |
| `callbacks`               |                                            | Not currently supported.                                                     |
| `deprecated`              | `#deprecated` directive                    |                                                                              |
| `security`                |                                            | see [Security Schemes Object](#securitydefinitions--securityschemes-object). |
| `servers`                 | `@server` decorator                        | Can be specified multiple times.                                             |

### Tags

Tags can be specified using the `@tag` decorator on an operation.
The `@tag` decorator can also be used on a namespace or interface to specify tags for all operations within the namespace or interface.
Tags are additive, so tags specified on an operation are added to the tags specified on the namespace or interface.
The `@tag` decorator can be used multiple times to specify multiple tags on an operation, namespace, or interface.

### Description

Use the `@doc` decorator to specify a description for an operation. The value of the `@doc` decorator can be a multi-line string
and can contain markdown formatting.

```typespec
@doc("""
  Get status info for the service.
  The status includes the current version of the service.
  The status value may be one of:
  - `ok`: the service is operating normally
  - `degraded`: the service is operating in a degraded state
  - `down`: the service is not operating
  """)
@tag("Status")
@route("/status")
@get
op status(): string;
```

You can also use a "doc comment" to specify the description for an operation. A doc comment is a comment that begins with `/**`.
Doc comments may be spread across multiple lines and may contain markdown formatting.

```typespec
/**
 * Get health info for the service.
 * The health includes the current version of the service.
 * The health value may be one of:
 * - `ok`: the service is operating normally
 * - `degraded`: the service is operating in a degraded state
 * - `down`: the service is not operating
 */
@tag("Health")
@route("/health")
@get
op health(): string;
```

[See documentation doc for more information](../language-basics/documentation.md).

### operationId

You can specify the operationId for an operation using the `@operationId` decorator.
When the `@operationId` decorator is not specified, the operationId is generated from the operation name.
For an operation defined in the top-level namespace, the operationId is the just operation name.
If the operation is defined within a inner namespace or interface, then the operationId is
prefixed with the name of the innermost namespace or interface name.

Note: this approach will generally produce unique operationIds, as required by OpenAPI,
but it is possible to create duplicate operationIds.

## Parameter Object

In OpenAPI, a parameter object [[v2][v2-parameter], [v3][v3-parameter]] describes a single operation parameter.

[v2-parameter]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#parameter-object
[v3-parameter]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#parameter-object

The following fields of a parameter object are common to both OpenAPI v2 and v3:

| OpenAPI `parameter` field | TypeSpec construct           | Notes                                                                                                                        |
| ------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `name`                    | parameter name               |                                                                                                                              |
| `in`                      | decorator                    | `@query`, `@path`, `@header`, `@body`                                                                                        |
| `description`             | `/** */` or `@doc` decorator |                                                                                                                              |
| `required`                | from parameter "optionality" | a "?" following the parameter name indicates it is optional (`required: false`), otherwise it is required (`required: true`) |
| `allowEmptyValue`         |                              | Not supported, this field is `NOT RECOMMENDED` in OpenAPI.                                                                   |

<!-- prettier-ignore-end -->

### OpenAPI v2

The following fields of a parameter object are specific to OpenAPI v2:

| OpenAPI v2 `parameter` field | TypeSpec construct                          | Notes                         |
| ---------------------------- | ------------------------------------------- | ----------------------------- |
| `type`                       | parameter type                              | see [Data Types](#data-types) |
| `collectionFormat`           | uri template in `@route` or `expode, style` |                               |

#### Collection Formats

In OpenAPI v2, the `collectionFormat` field of a query or header parameter object specifies how multiple values are delimited.
You can use a combination of the `@encode` decorator and `explode` field of the `@query` or `@header` decorator to specify the collection format.

```typespec
op read(
  @query csv?: string[], // equivalent to collectionFormat: csv
  @query(#{ explode: false }) csvExplicit?: string[], // equivalent to collectionFormat: csv
  @query(#{ explode: true }) multi?: string[], // equivalent to collectionFormat: multi
  @query @encode(ArrayEncoding.pipeDelimited) pipes?: string[], // equivalent to collectionFormat: pipes
): Widget | Error;
```

### OpenAPI v3

The following fields of a parameter object are specific to OpenAPI v3:

| OpenAPI v3 `parameter` field | TypeSpec construct                                                                                              | Notes                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `style`                      | `explode` parameter on `@query` or `@header` and `@encode`                                                      |                                                                                 |
| `explode`                    | `explode` parameter on `@query` or `@header`                                                                    |                                                                                 |
| `schema`                     | parameter schema                                                                                                | see [Schema Object](#schema-object)                                             |
| `deprecated`                 | `#deprecated` directive.                                                                                        |                                                                                 |
| `example`                    | `@example` on data types (e.g. models, scalars), `@opExample` to describe in-line parameters of operations      | Open API 3.0 only supports a single example when using `@example` on data types |
| `examples`                   | `@example` on data types (e.g. models, scalars), `@opExample` to describe parameters/return types of operations | Open API 3.1 always outputs `examples` instead of `example`.                    |
| `content`                    |                                                                                                                 | Not currently supported.                                                        |

## Request Body Object (OAS3)

In OpenAPI v3, the operation request body is defined with a [Request Body object] rather than as a parameter.

[Request Body object]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#request-body-object

An OpenAPI v3 Request Body object corresponds to a TypeSpec `op` parameter with the `@body` decorator.

<!-- prettier-ignore-start -->
| OpenAPI `requestBody` field | TypeSpec construct      | Notes        |
| --------------------------- | ----------------------- | ------------ |
| `description`               | `@doc` decorator        |              |
| `required`                  | parameter "optionality" | a "?" following the parameter name indicates it is optional (`required: false`), otherwise it is required (`required: true`) |
| `content`                   | `@body` parameter type  |              |
<!-- prettier-ignore-end -->

The media type of the request body is specified with a `content-type` header. If `content-type` has multiple values
then `content` will have one entry for each value.

```typespec
@put op uploadImage(@header contentType: "image/png", @body image: bytes): void;
@post op analyze(
  @header contentType: "application/octet-stream" | "application/pdf" | "image/jpeg",
  @body image: bytes,
): string | Error;
```

To get multiple `content` entries with different schemas (say one structured and one binary),
you need to define two separate operations that share the same path and method.
You do with with the `@sharedRoute` decorator.

```typespec
@route(":process")
namespace Process {
  @sharedRoute
  @post
  op process(...Widget): Widget | Error;

  model CsvBody {
    @header contentType: "text/csv";
    @body _: string;
  }
  @sharedRoute
  @post
  op process2(...CsvBody): Widget | Error;
}
```

## Responses Object

In OpenAPI, the responses object [[v2][v2-responses], [v3][v3-responses]] specifies the possible responses for an operation.
The responses object maps a HTTP response code to the expected response.

[v2-responses]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#responses-object
[v3-responses]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#responses-object

In TypeSpec, operation responses are defined by the return types of the `op`. The status code for a response can be specified as a property in the return type with the `@statusCode` decorator. The value of the property with the `@statusCode` decorator should be an HTTP status code or union of status codes. When the value is a union of status codes, a response is generated for each status code in the union.

If a return type does not contain a `statusCode`, the default is `200` except for `void` which defaults to `204`.

To get the `default` response, specify the `@error` decorator on the return type model.

```typespec
@get op read(@path id: string): Widget; // has "200" response
@delete op delete(@path id: string): void; // has "204" response
// has "200" and "201" response
@put op create(@body widget: Widget): {
  @statusCode _: "200" | "201";
  @body body: Widget;
};
// has "200" and "default" response
@post op update(@body widget: Widget): Widget | Error;
```

The TypeSpec.Http package also defines several standard response types.

| HTTP Status Code | TypeSpec construct     |
| ---------------- | ---------------------- |
| `200`            | `OkResponse`           |
| `201`            | `CreatedResponse`      |
| `202`            | `AcceptedResponse`     |
| `204`            | `NoContentResponse`    |
| `301`            | `MovedResponse`        |
| `304`            | `NotModifiedResponse`  |
| `401`            | `UnauthorizedResponse` |
| `404`            | `NotFoundResponse`     |
| `409`            | `ConflictResponse`     |

You can intersect these standard response types with your own response types.

```typespec
// has "200", '409', and "default" responses
@post op update(@body widget: Widget): Widget | (ConflictResponse & Error) | Error;
```

### Response Object

In OpenAPI, a response object [[v2][v2-response], [v3][v3-response]] describes a single response for an operation.
The structure of the response object changed significantly from OpenAPI v2 to OpenAPI v3, but there are many
elements common to both.

[v2-response]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#response-object
[v3-response]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#response-object

The fields in an OpenAPI response object are specified with the following TypeSpec constructs:

| OpenAPI `response` field | TypeSpec construct                                  | Notes                                               |
| ------------------------ | --------------------------------------------------- | --------------------------------------------------- |
| `description`            | `@doc` decorator                                    |                                                     |
| `headers`                | fields in the return type with `@header` decorator  | Required or optional based on optionality of field. |
| `schema` (OAS2)          | return type or type of `@body`` property            |                                                     |
| `content` (OAS3)         | return type or type of `@body`` property            |                                                     |
| `examples` (OAS3)        | `@opExample` to describe return types of operations | Supported on an operation.                          |
| `links` (OAS3)           |                                                     | Not currently supported.                            |

```typespec
@get op read(@path id: string): {
  /** the widget */
  @body
  widget: Widget;

  @header xRateLimitRemaining: int32;
  @header xRateLimitReset: int32;
};
```

The media type of the request body is specified with a `content-type` header. If `content-type` has multiple values
then `content` will have one entry for each value.

To get multiple `content` entries with different schemas, use a union type.

```typespec
@tag("Response Content")
@route("/response-content")
namespace ResponseContent {
  @get op read(@path id: string): Widget | {
    @header contentType: "text/html";
    @body _: string;
  } | {
    @header contentType: "image/jpeg";
    @body _: bytes;
  };
}
```

## Schema Object

OpenAPI schemas are represented in TypeSpec by [models](https://typespec.io/docs/language-basics/models/).
Models have any number of members and can extend and be composed with other models.

Models can be defined with the `model` statement and then referenced by name, which generally results in a `$ref` to a schema for the model in the `definitions` or `components.schemas` section of the OpenAPI document.

TypeSpec supports the ["spread" operator](https://typespec.io/docs/language-basics/models/#spread) (`...`), which copies the members of the source model into the target model.
But TypeSpec processes all spread transformations before emitters are invoked, so this form of reuse is not represented in the emitted OpenAPI.

The spread operation is useful if you want one or more properties to be present in several different models but in a standard fashion. For example:

```typespec
model Legs {
  /** number of legs */
  legs: int32;
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

### additionalProperties/unevaluatedProperties

You can generate a schema with `additionalProperties` with the TypeSpec `Record` construct.

**Note:** `unevaluatedProperties` is used instead of `additionalProperties` when emitting Open API 3.1 specs.

```typespec
  bar: Record<unknown>;
```

is produced as

```yaml title=openapi.yaml
bar:
  type: object
  additionalProperties: {}
```

To get a schema having both `properties` and `additionalProperties`, define a model that extends `Record<unknown>`.

```typespec
model Bar extends Record<unknown> {
  bar?: string;
}
```

produces

```yaml title=openapi.yaml
Bar:
  type: object
  properties:
    bar:
      type: string
  additionalProperties: {}
```

To define a schema with `additionalProperties` that has a specific type, use the `Record` construct with a type parameter.

```typespec
  bar: Record<string>;
```

results in

```yaml title=openapi.yaml
bar:
  type: object
  additionalProperties:
    type: string
```

To define a schema that **does not** allow any additional properties, use `Record<never>`.

```typespec
  bar: Record<never>;
```

results in

```yaml title=openapi.yaml
bar:
  type: object
  additionalProperties:
    not: {}
```

In the openapi3 emitter, schemas that don't define `additionalProperties` can automatically be set to `additionalProperties: { not: {} }` by setting the `seal-object-schemas` emitter option to `true`. This will not add `additionalProperties` to object schemas that are referenced in an `allOf` of another schema.

### allOf and polymorphism using allOf

TypeSpec supports single inheritance of models with the `extends` keyword. This construct can be used to produce an `allOf` with a single element (the parent schema) in OpenAPI. For example:

```typespec title=main.tsp
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

TypeSpec does not currently provide a means to produce an `allOf` with more than one element -- these are generally treated as "composition" in code generators and thus better represented in TypeSpec with the spread operator.

Models with a `@discriminator` decorator can be extended to produce polymorphic schemas in either OpenAPI v2 or v3 using `allOf`.
This schema produced for the base model will be defined with a `discriminator` property and schemas for the child models will `allOf` the base schema and add additional properties.

For example:

```typespec
@discriminator("kind")
model Pet {
  name: string;
  weight?: float32;
}
model Cat extends Pet {
  kind: "cat";
  meow?: int32;
}
model Dog extends Pet {
  kind: "dog";
  bark?: string;
}
```

generates:

```yaml title=openapi.yaml
Cat:
  type: object
  properties:
    kind:
      type: string
      enum:
        - cat
    meow:
      type: integer
      format: int32
  required:
    - kind
  allOf:
    - $ref: "#/components/schemas/Pet"
Dog:
  type: object
  properties:
    kind:
      type: string
      enum:
        - dog
    bark:
      type: string
  required:
    - kind
  allOf:
    - $ref: "#/components/schemas/Pet"
Pet:
  type: object
  properties:
    kind:
      type: string
      description: Discriminator property for Pet.
    name:
      type: string
    weight:
      type: number
      format: float
  discriminator:
    propertyName: kind
    mapping:
      cat: "#/components/schemas/Cat"
      dog: "#/components/schemas/Dog"
  required:
    - name
```

### Polymorphism using anyOf and oneOf (OAS3)

Polymorphism can also be represented in OpenAPI v3 with `anyOf` or `oneOf` constructs.
These can be represented in TypeSpec with a union type.

```typespec
union Pet {
  cat: Cat,
  dog: Dog,
}

model Cat {
  meow?: int32;
}

model Dog {
  bark?: string;
}
```

generates a Pet schema with `anyOf`.

```yaml title=openapi.yaml
Pet:
  anyOf:
    - $ref: "#/components/schemas/Cat"
    - $ref: "#/components/schemas/Dog"
```

The openapi emitter uses `anyOf` by default because the schemas may not be mutually exclusive.
But the `@oneOf` decorator of the OpenAPI library can be used to force the use of `oneOf` instead.

```typespec
import "@typespec/openapi3";
using OpenAPI;

@oneOf
union Pet {
  cat: Cat,
  dog: Dog,
}
```

produces:

```yaml title=openapi.yaml
Pet:
  oneOf:
    - $ref: "#/components/schemas/Cat"
    - $ref: "#/components/schemas/Dog"
```

To make Pet a discriminated union, add the `@discriminator` decorator and add the discriminator property
with a string literal value to each of the child schemas.
View the [`@discriminated` documentation](https://typespec.io/docs/standard-library/built-in-decorators/#@discriminated) to learn how to further customize what is emitted.

```typespec
@discriminated(#{ envelope: "none" })
union Pet {
  cat: Cat,
  dog: Dog,
}
model Cat {
  kind: "cat";
  meow?: int32;
}
model Dog {
  kind: "dog";
  bark?: string;
}
```

results in the following schema for Pet:

```yaml title=openapi.yaml
Pet:
  oneOf:
    - $ref: "#/components/schemas/Cat"
    - $ref: "#/components/schemas/Dog"
  discriminator:
    propertyName: kind
    mapping:
      cat: "#/components/schemas/Cat"
      dog: "#/components/schemas/Dog"
```

## definitions / components

OpenAPI supports reuse of schemas, parameters, responses, and other elements with the `definitions` (OAS2) or `components` (OAS3) section of an OpenAPI definition.

Referencing a model by name (not with "spread"), as an `op` parameter or return type or as the type of a property in another model, generally results in a `$ref` to a schema for the model in the `definitions` or `components.schemas` section of the OpenAPI document.

Reusable parameters can be defined as members of a model and then incorporated into an operation parameter list using the spread operator. For example:

```typespec
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

[v2-info]: https://github.com/OAI/OpenAPI-Specification/blob/main/versions/2.0.md#info-object
[v3-info]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#info-object

In TypeSpec this information is specified with [decorators on the namespace][typespec-service-metadata].

| OpenAPI `info` field | TypeSpec decorator    | Notes                       |
| -------------------- | --------------------- | --------------------------- |
| `title`              | `@service(#{title: }` | TypeSpec built-in decorator |
| `description`        | `@doc`                | TypeSpec built-in decorator |
| `version`            | `@info`               |                             |
| `license`            | `@info`               |                             |
| `contact`            | `@info`               |                             |

[typespec-service-metadata]: https://typespec.io/docs/libraries/http/reference/decorators/

```typespec
/** The Contoso Widget Service provides access to the Contoso Widget API. */
@service(#{ title: "Widget Service" })
@info(#{
  contact: #{ name: "API Support", email: "contact@contoso.com" },
  license: #{ name: "Apache 2.0", url: "https://www.apache.org/licenses/LICENSE-2.0.html" },
})
namespace DemoService;
```

## Consumes / Produces (OAS2)

In OpenAPI v2, the top-level `consumes` and `produces` fields specify a list of MIME types an operation can consume / produce
when not overridden by a `consumes` or `produces` on an individual operation.

The typespec-autorest emitter previously supported `@produces` and `@consumes` decorators on a namespace, but these are deprecated
in favor of explicit `content-type` and `accept` header properties in request and response bodies.

## securityDefinitions / securitySchemes Object

Use the `@useAuth` decorator from the `@typespec/rest" library

```typespec
using Http;
@useAuth(OAuth2Auth<["read", "write"]>)
namespace MyService;
```

## Specification Extensions

You can add arbitrary specification extensions ("x-" properties) to a model or an operation with the `@extension` decorator.
For example:

```typespec
namespace Pets {
  @extension("x-streaming-operation", true) op read(...PetId): Pet | Error;
}
```

OpenAPI decorators that map directly to an object in the openapi document also allow to provide extension.

`@tagMetadata`

```tsp
@tagMetadata("my-tag", #{
  description: "My tag",
  `x-custom`: "custom value",
})
```

- `@info`

```tsp
@info(#{
  version: 1.1.0,
  `x-custom`: "custom value",
})
```
