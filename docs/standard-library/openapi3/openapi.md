---
title: Emitter operation
---

# How the OpenAPI emitter works

The OpenAPI emitter converts TypeSpec language elements into their natural OpenAPI expression as described below.

## Servers

If the TypeSpec file contains an [(Http) `@server` decorator](../rest/reference/decorators.md#@TypeSpec.Http.server)
the OpenAPI emitter will generate a `servers` object with the server URL, description, and variables specified in the decorator.

You can specify multiple `@server` decorators to obtain multiple entries in the `servers` object.

## Operations

Each TypeSpec operation becomes an OpenAPI operation.

The HTTP method for the operation is either explicitly specified with an [(Http) `@get`, `@post`, `@put`, `@patch`, or `@delete` decorator][http-verb-decorators] on the operation or it is inferred from the operation name and signature.

The path for the operation comes from the [(Http) `@route` decorator][http-route-decorator] on the operation.
The `@route` decorator can also be specified on a namespace and/or an interface (group of operations).
When specified, the route for the enclosing namespace(s) and interface are prefixed to the operation route.

[http-verb-decorators]: ../rest/reference/decorators.md
[http-route-decorator]: ../rest/reference/decorators.md#@TypeSpec.Http.route

The fields of the [OpenAPI Operation object][] are set as described below.

[openapi operation object]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#operationObject

### description

The description field is set from the [(built-in) `@doc` decorator][doc-decorator] on the TypeSpec operation, and omitted when `@doc` is not present.

[doc-decorator]: ../built-in-decorators.md#doc

### summary

The summary field is set from the [(built-in) `@summary` decorator][summary-decorator] on the TypeSpec operation, and omitted when `@summary` is not present.

[summary-decorator]: ../built-in-decorators.md#summary

### operationId

The operationId can be explicitly specified with the [(OpenAPI) `@operationId` decorator][openapi-operationid-decorator],
and otherwise is simple the operation name, prefixed with "<interface*name>*" when the operation is within an interface.

[openapi-operationid-decorator]: ../built-in-decorators.md#operationId

### parameters and requestBody

The parameters of the TypeSpec operation are translated into the parameter list and requestBody for the OpenAPI operation.

The `in` field of a parameter is specified with an [(Http) `@query`, `@header`, or `@path` decorator][http-parameter-decorators].
A parameter without one of these decorators is assumed to be passed in the request body.

The request body parameter can also be explicitly decorated with an [(Http) `@body` decorator][http-body-decorator].
In the absence of explicit `@body`, the set of parameters that are not marked `@header`, `@query`, or `@path` form the request body
and this request body is defined as required. If the request body should be optional, the body must be declared as
optional property with the `@body` decorator.

[http-parameter-decorators]: ../rest/reference/decorators.md#data-types
[http-body-decorator]: ../rest/reference/decorators.md#@TypeSpec.Http.body

The content of a (built-in) `@doc` decorator on a parameter will be set in the description.

The TypeSpec parameter type will be translated into an appropriate OpenAPI schema for the parameter.

Likewise, the type of the body parameter(s) will be translated into an appropriate OpenAPI schema for the requestBody.
The request body will use the "application/json" media type unless the body model includes an explicit `content-type`
header.

See also [metadata](../http/operations.md#metadata) for more advanced details.

### responses

The return type(s) of the TypeSpec operation are translated into responses for the OpenAPI operation.
The status code for a response can be specified as a property in the return type model with the [(Http) `@statusCode` decorator][http-statuscode-decorator] (the property name is ignored).
If the [(built-in) `@error` decorator][error-decorator] is specified on a return type, this return type becomes the "default" response for the operation.
The media type for a response will be "application/json" unless the return type model includes an explicit `content-type`
header.
Models with different status codes and/or media types can be unioned together to describe complex response designs.

When a return type model has a property explicitly decorated with an [(Http) `@body` decorator][http-body-decorator], this
is taken as the response body.
In the absence of explicit `@body`, the properties that are not marked `@statusCode` or `@header` form the response body.

[http-statuscode-decorator]: ../rest/reference/decorators.md#@TypeSpec.Http.statuscode
[error-decorator]: ../built-in-decorators.md#error

See also [metadata](../http/operations.md#metadata) for more advanced details.

### tags

Any tags specified with the [(built-in) `@tag` decorator][tag-decorator] on the operation, interface, or
enclosing namespace(s) are included in the OpenAPI operation's tags array.

[tag-decorator]: ../built-in-decorators.md#tag

### deprecated

If the [(built-in) `#deprecated` directive][deprecated-decorator] is specified on the operation, then the operation's
deprecated field is set to true.

[deprecated-decorator]: ../built-in-decorators.md#deprecated

### externalDocs

If the TypeSpec operation has an [(OpenAPI) `@externalDocs` decorator](../openapi/reference/decorators.md#@OpenAPI.externaldocs) this will produce
an externalDocs field in the OpenAPI operation.

### Specification extensions

Any extensions specified on the TypeSpec operation with the [(OpenAPI) `@extension` decorator](../openapi/reference/decorators.md#OpenAPI.extension)
are included in the emitted OpenAPI operation.

## Models and enums

Models and enums are converted into schemas in the generated OpenAPI definition. Intrinsic types in TypeSpec are represented
with a JSON Schema type that most closely matches the semantics of the TypeSpec type.

Models defined inline will result in an inline schema. Explicitly declared models will be defined in the `components/schemas`
section with the TypeSpec name qualified by any enclosing namespaces.

A special case is an instantiation of a model template, it is treated as an inline model unless the model template has
a [(built-in) `@friendlyName` decorator][friendlyname], in which case the schema is defined in `components/schemas` with the friendly-name.

[friendlyname]: ../built-in-decorators.md#friendlyname

The following table shows how TypeSpec types are translated to JSON Schema types:

| TypeSpec type    | OpenAPI `type`/`format`           | Notes                                                                     |
| ---------------- | --------------------------------- | ------------------------------------------------------------------------- |
| `int32`          | `type: integer, format: int32`    |                                                                           |
| `int64`          | `type: integer, format: int64`    |                                                                           |
| `float32`        | `type: number, format: float`     |                                                                           |
| `float64`        | `type: number, format: double`    |                                                                           |
| `string`         | `type: string`                    |                                                                           |
| `bytes`          | `type: string, format: byte`      | for content-type == 'application/json' or 'text/plain'                    |
| `bytes`          | `type: string, format: binary`    | for "binary" content types, e.g. 'application/octet-stream', 'image/jpeg' |
| `boolean`        | `type: boolean`                   |                                                                           |
| `plainDate`      | `type: string, format: date`      |                                                                           |
| `utcDateTime`    | `type: string, format: date-time` | RFC 3339 date in coordinated universal time (UTC)                         |
| `offsetDateTime` | `type: string, format: date-time` | RFC 3339 date with timezone offset                                        |

[See encoding and format](#encoding-and-formats) for other way to encode those types.

There are a variety of decorators that can modify or add metadata to the definitions produced in the generated OpenAPI.

For a numeric element (integer or float):

| Decorator          | Library  | OpenAPI/JSON Schema keyword | Notes |
| ------------------ | -------- | --------------------------- | ----- |
| `@minValue(value)` | built-in | `minimum: value`            |       |
| `@maxValue(value)` | built-in | `maximum: value`            |       |

For any element defined as a `string` or a type that extends from `string`:

| Decorator           | Library  | OpenAPI/JSON Schema keyword | Notes                                                      |
| ------------------- | -------- | --------------------------- | ---------------------------------------------------------- |
| `@format(name)`     | built-in | `format: name`              | When format is not determined by type or another decorator |
| `@minLength(value)` | built-in | `minLength: value`          |                                                            |
| `@maxLength(value)` | built-in | `maxLength: value`          |                                                            |
| `@pattern(regex)`   | built-in | `pattern: regex`            |                                                            |
| `@secret`           | built-in | `format: password`          |                                                            |

For an array type:

| Decorator          | Library  | OpenAPI/JSON Schema keyword | Notes |
| ------------------ | -------- | --------------------------- | ----- |
| `@minItems(value)` | built-in | `minItems: value`           |       |
| `@maxItems(value)` | built-in | `maxItems: value`           |       |

The OpenAPI emitter provides an [`@useRef` decorator](../openapi/reference/decorators.md#@OpenAPI.useref) which will replace the TypeSpec model type in emitter output
with a reference to a pre-existing named OpenAPI schema. This can be useful for "common" schemas.

Example:

```typespec
@useRef("common.json#/components/schemas/Sku")
model Sku {
...
}
```

Enums can be defined in TypeSpec with the [`enum` statement](../../language-basics/enums.md), e.g.:

```typespec
enum Color {
  Red: "red",
  Blue: "blue",
  Green: "green",
}
```

The union operator can also be used to define the enum values inline, e.g.:

```typespec
status: "Running" | "Stopped" | "Failed"
```

The OpenAPI emitter converts both of these into a schema definition containing an "enum" with the list of defined values.

### Model composition

TypeSpec has several mechanisms for model composition and extension. The following describes how these are handled in the OpenAPI emitter.

#### Spread

The spread operator does not convey any semantic relationship between the source and target models so the OpenAPI emitter
treats this as if the properties of the source model were explicitly included in the target model at the position where the
spread appears.

#### Extends

When one model extends another model, this is intended to convey and inheritance relationship. While OpenAPI has no formal
construct for inheritance, the OpenAPI emitter represents this form of composition with an `allOf` in the schema of the child model
that references the schema for the parent model.

##### Extends with discriminator

The OpenAPI emitter supports the `@discriminator(propertyName)` decorator on a `model`. This will produce a `discriminator` object
with the named property in the schema for this model.

Models that extend this model must define this property with a literal string value, and these values must be distinct across all the
models that extend this model. These values are used to construct a `mapping` for the discriminator.

The `@discriminator` decorator can be used to create multi-level discriminated inheritance but must use a different discriminated property at each level.

#### Is

The `is` keyword provides a form of composition similar to the spread operator, where no semantic relationship is conveyed between
the source and target models. The OpenAPI emitter represents this form of composition with an independent schema that contains
all the same properties as the model named by the `is` keyword, plus any properties defined directly on the model.

#### Union

Unions are another form of model composition.

Unions can be defined in two different ways in TypeSpec. One way is with
[the union type operator](../../language-basics/unions.md#union-expressions), `|`:

```typespec
alias GoodBreed = Beagle | GermanShepherd | GoldenRetriever;
```

The second way is with [the `union` statement](../../language-basics/unions.md#named-unions)
which not only declares the variant models but also assigns a name for each.

```typespec
union GoodBreed {
  beagle: Beagle,
  shepherd: GermanShepherd,
  retriever: GoldenRetriever,
}
```

The OpenAPI emitter represents either form of union with an `anyOf` with an element for each option of the union.
The OpenAPI emitter ignores the "names" for variants in named unions.

The OpenAPI emitter also defines the[`@oneOf` decorator](../openapi/reference/decorators.md#OpenAPI.oneof) which can be specified on a `union` statement to indicate
that a union should be emitted as a `oneOf` rather than `anyOf`.

## Encoding and formats

When working with the `@encode` decorator the rule is as follow. Given the 3 values `encoding`, `encodeAs` and `realType` where `@encode(encoding, encodeAs) _: realType`:

1. Is one of those special cases:

   - `unixTimestamp` encoding will produce `type: integer, format: unixtime`
   - encoding a `utcDateTime` or `offsetDateTime` will produce this format `date-time-<encoding>` (e.g. `date-time-rfc7231` for `rfc7231` encoding)

2. When `encodeAs` is specified, it will be used to generate the corresponding schema (e.g. encoding as `int32` will produce an `type: integer, format: int32` )

3. Otherwise use the `encoding` as the format

**Summary table**

| encoding                                         | Openapi3                                  | Swagger 2.0 (autorest)                    |
| ------------------------------------------------ | ----------------------------------------- | ----------------------------------------- |
| `@encode("seconds", int32) _: duration`          | `type: integer, format: int32`            | `type: integer, format: int32`            |
| `@encode("seconds", float32) _: duration`        | `type: number, format: float32`           | `type: number, format: float32`           |
| `@encode("ISO8601") _: duration`                 | `type: number, format: duration`          | `type: number, format: duration`          |
| `@encode("unixTimestamp", int32) _: utcDateTime` | `type: integer, format: unixtime`         | `type: integer, format: unixtime`         |
| `@encode("unixTimestamp", int64) _: utcDateTime` | `type: integer, format: unixtime`         | `type: integer, format: unixtime`         |
| `@encode("rfc3339") _: utcDateTime`              | `type: string, format: date-time`         | `type: string, format: date-time`         |
| `@encode("rfc7231") _: utcDateTime`              | `type: string, format: date-time-rfc7321` | `type: string, format: date-time-rfc7321` |

## Security Definitions

The OpenAPI emitter takes the [(http) `@useAuth` decorator](../rest/reference/decorators.md#@TypeSpec.Http.useauth)

### Examples

The following example shows how to define a security scheme for Azure Active Directory authentication:

```typespec
@useAuth(AADToken)
namespace Contoso.WidgetManager;
@doc("The Azure Active Directory OAuth2 Flow")
model AADToken
  is OAuth2Auth<[
    {
      type: OAuth2FlowType.authorizationCode;
      authorizationUrl: "https://api.example.com/oauth2/authorize";
      tokenUrl: "https://api.example.com/oauth2/token";
      scopes: ["https://management.azure.com/read", "https://management.azure.com/write"];
    }
  ]>;
```
