---
title: Emitter operation
---

The OpenAPI emitter is designed to translate TypeSpec language elements into their corresponding OpenAPI expressions. Here's how it works:

## Server Details

If the TypeSpec file includes an [(Http) `@server` decorator](../../libraries/http/reference/decorators.md#@TypeSpec.Http.server), the OpenAPI emitter will create a `servers` object. This object will contain the server URL, description, and variables as defined in the decorator.

You can use multiple `@server` decorators to generate multiple entries in the `servers` object.

## Operations

Every TypeSpec operation is converted into an OpenAPI operation by the emitter.

The HTTP method for the operation can be explicitly defined using an [(Http) `@get`, `@post`, `@put`, `@patch`, or `@delete` decorator][http-verb-decorators] on the operation. If not explicitly defined, the HTTP method is inferred from the operation name and signature.

The operation's path is derived from the [(Http) `@route` decorator][http-route-decorator] on the operation. The `@route` decorator can also be applied to a namespace and/or an interface (a group of operations). If specified, the route for the enclosing namespace(s) and interface are prefixed to the operation route.

[http-verb-decorators]: ../../libraries/http/reference/decorators.md
[http-route-decorator]: ../../libraries/http/reference/decorators.md#@TypeSpec.Http.route

The [OpenAPI Operation object][] fields are set as described below.

[openapi operation object]: https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#operationObject

### Description

The description field is populated from the [(built-in) `@doc` decorator][doc-decorator] on the TypeSpec operation. If `@doc` is not present, the description field is omitted.

[doc-decorator]: ../../standard-library/built-in-decorators.md#@doc

### Summary

The summary field is populated from the [(built-in) `@summary` decorator][summary-decorator] on the TypeSpec operation. If `@summary` is not present, the summary field is omitted.

[summary-decorator]: ../../standard-library/built-in-decorators.md#@summary

### Operation ID

The operation ID can be explicitly defined using the (OpenAPI) `@operationId` decorator. If not explicitly defined, the operation ID is simply the operation name, prefixed with "<interface*name>*" when the operation is within an interface.

### Parameters and Request Body

The parameters of the TypeSpec operation are translated into the parameter list and request body for the OpenAPI operation.

The `in` field of a parameter is defined using an [(Http) `@query`, `@header`, or `@path` decorator][http-parameter-decorators]. A parameter without one of these decorators is assumed to be passed in the request body.

The request body parameter can also be explicitly defined with an [(Http) `@body` decorator][http-body-decorator]. If `@body` is not explicitly defined, the set of parameters that are not marked `@header`, `@query`, or `@path` form the request body, which is defined as required. If the request body should be optional, it must be declared as an optional property with the `@body` decorator.

[http-parameter-decorators]: ../../libraries/http/reference/decorators.md
[http-body-decorator]: ../../libraries/http/reference/decorators.md#@TypeSpec.Http.body

The content of a (built-in) `@doc` decorator on a parameter will be set in the description.

The TypeSpec parameter type will be translated into an appropriate OpenAPI schema for the parameter.

Similarly, the type of the body parameter(s) will be translated into an appropriate OpenAPI schema for the request body. The request body will use the "application/json" media type unless the body model includes an explicit `content-type` header.

For more advanced details, see [metadata](../../libraries/http/operations.md#metadata).

### Responses

The return type(s) of the TypeSpec operation are translated into responses for the OpenAPI operation. The status code for a response can be defined as a property in the return type model with the [(Http) `@statusCode` decorator][http-statuscode-decorator] (the property name is ignored). If the [(built-in) `@error` decorator][error-decorator] is specified on a return type, this return type becomes the "default" response for the operation. The media type for a response will be "application/json" unless the return type model includes an explicit `content-type` header. Models with different status codes and/or media types can be combined to describe complex response designs.

When a return type model has a property explicitly decorated with an [(Http) `@body` decorator][http-body-decorator], this is considered as the response body. In the absence of an explicit `@body`, the properties that are not marked `@statusCode` or `@header` form the response body.

[http-statuscode-decorator]: ../../libraries/http/reference/decorators.md#@TypeSpec.Http.statusCode
[error-decorator]: ../../standard-library/built-in-decorators.md#@error

For more advanced details, see [metadata](../../libraries/http/operations.md#metadata).

### Tags

Any tags specified with the [(built-in) `@tag` decorator][tag-decorator] on the operation, interface, or enclosing namespace(s) are included in the OpenAPI operation's tags array.

[tag-decorator]: ../../standard-library/built-in-decorators.md#@tag

### Deprecated

If the [(built-in) `#deprecated` directive][deprecated-decorator] is specified on the operation, then the operation's deprecated field is set to true.

[deprecated-decorator]: ../../standard-library/built-in-decorators.md#@deprecated

### External Documentation

If the TypeSpec operation has an [(OpenAPI) `@externalDocs` decorator](../../libraries/openapi/reference/decorators.md#@TypeSpec.OpenAPI.externalDocs), this will generate an externalDocs field in the OpenAPI operation.

### Specification Extensions

Any extensions specified on the TypeSpec operation with the [(OpenAPI) `@extension` decorator](../../libraries/openapi/reference/decorators.md#@TypeSpec.OpenAPI.extension) are included in the emitted OpenAPI operation.

## Models and Enums

Models and enums are converted into schemas in the generated OpenAPI definition. Intrinsic types in TypeSpec are represented with a JSON Schema type that closely matches the semantics of the TypeSpec type.

Inline defined models will result in an inline schema. Explicitly declared models will be defined in the `components/schemas` section with the TypeSpec name qualified by any enclosing namespaces.

A special case is an instantiation of a model template, it is treated as an inline model unless the model template has a [(built-in) `@friendlyName` decorator][friendlyname], in which case the schema is defined in `components/schemas` with the friendly-name.

[friendlyname]: ../../standard-library/built-in-decorators.md#@friendlyName

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

[See encoding and format](#encoding-and-formats) for other ways to encode these types.

There are several decorators that can modify or add metadata to the definitions produced in the generated OpenAPI.

For a numeric element (integer or float):

| Decorator          | Library  | OpenAPI/JSON Schema keyword | Notes |
| ------------------ | -------- | --------------------------- | ----- |
| `@minValue(value)` | built-in | `minimum: value`            |       |
| `@maxValue(value)` | built-in | `maximum: value`            |       |

For any element defined as a `string` or a type that extends from `string`:

| Decorator           | Library  | OpenAPI/JSON Schema keyword | Notes                                                           |
| ------------------- | -------- | --------------------------- | --------------------------------------------------------------- |
| `@format(name)`     | built-in | `format: name`              | Used when format is not determined by type or another decorator |
| `@minLength(value)` | built-in | `minLength: value`          |                                                                 |
| `@maxLength(value)` | built-in | `maxLength: value`          |                                                                 |
| `@pattern(regex)`   | built-in | `pattern: regex`            |                                                                 |
| `@secret`           | built-in | `format: password`          |                                                                 |

For an array type:

| Decorator          | Library  | OpenAPI/JSON Schema keyword | Notes |
| ------------------ | -------- | --------------------------- | ----- |
| `@minItems(value)` | built-in | `minItems: value`           |       |
| `@maxItems(value)` | built-in | `maxItems: value`           |       |

The OpenAPI emitter provides an [`@useRef` decorator](./reference/decorators.md#@TypeSpec.OpenAPI.useRef) which will replace the TypeSpec model type in emitter output with a reference to a pre-existing named OpenAPI schema. This can be useful for "common" schemas.

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

### Model Composition

TypeSpec provides several mechanisms for model composition and extension. The following describes how these are handled in the OpenAPI emitter.

#### Spread

The spread operator does not convey any semantic relationship between the source and target models, so the OpenAPI emitter treats this as if the properties of the source model were explicitly included in the target model at the position where the spread appears.

#### Extends

When one model extends another model, this is intended to convey an inheritance relationship. While OpenAPI has no formal construct for inheritance, the OpenAPI emitter represents this form of composition with an `allOf` in the schema of the child model that references the schema for the parent model.

##### Extends with Discriminator

The OpenAPI emitter supports the `@discriminator(propertyName)` decorator on a `model`. This will produce a `discriminator` object with the named property in the schema for this model.

Models that extend this model must define this property with a literal string value, and these values must be distinct across all the models that extend this model. These values are used to construct a `mapping` for the discriminator.

The `@discriminator` decorator can be used to create multi-level discriminated inheritance but must use a different discriminated property at each level.

#### Is

The `is` keyword provides a form of composition similar to the spread operator, where no semantic relationship is conveyed between the source and target models. The OpenAPI emitter represents this form of composition with an independent schema that contains all the same properties as the model named by the `is` keyword, plus any properties defined directly on the model.

#### Union

Unions are another form of model composition.

Unions can be defined in two different ways in TypeSpec. One way is with [the union type operator](../../language-basics/unions.md#union-expressions), `|`:

```typespec
alias GoodBreed = Beagle | GermanShepherd | GoldenRetriever;
```

The second way is with [the `union` statement](../../language-basics/unions.md#named-unions) which not only declares the variant models but also assigns a name for each.

```typespec
union GoodBreed {
  beagle: Beagle,
  shepherd: GermanShepherd,
  retriever: GoldenRetriever,
}
```

The OpenAPI emitter represents either form of union with an `anyOf` with an element for each option of the union. The OpenAPI emitter ignores the "names" for variants in named unions.

The OpenAPI emitter also defines the[`@oneOf` decorator](./reference/decorators.md#@TypeSpec.OpenAPI.oneOf) which can be specified on a `union` statement to indicate that a union should be emitted as a `oneOf` rather than `anyOf`.

## Encoding and Formats

When working with the `@encode` decorator, the rule is as follows. Given the 3 values `encoding`, `encodeAs`, and `realType` where `@encode(encoding, encodeAs) _: realType`:

1. If `realType` is `utcDateTime` or `offsetDateTime`:
   - `encoding` of `rfc3339` will produce `type: string, format: date-time`
   - `encoding` of `rfc7231` will produce `type: string, format: http-date`
2. If `realType` is `utcDateTime` and `encoding` is `unixTimestamp`:
   - `encodeAs` of any integer type will produce `type: integer, format: unixtime`
3. If the schema of `encodeAs` produces a `format`, use it (e.g., encoding as `int32` will produce `type: integer, format: integer`)
4. Otherwise, use the `encoding` as the format

**Summary Table**

| encoding                                         | OpenAPI 3                         | Swagger 2.0 (autorest)            |
| ------------------------------------------------ | --------------------------------- | --------------------------------- |
| `@encode("seconds", int32) _: duration`          | `type: integer, format: int32`    | `type: integer, format: int32`    |
| `@encode("seconds", float32) _: duration`        | `type: number, format: float32`   | `type: number, format: float32`   |
| `@encode("ISO8601") _: duration`                 | `type: number, format: duration`  | `type: number, format: duration`  |
| `@encode("unixTimestamp", int32) _: utcDateTime` | `type: integer, format: unixtime` | `type: integer, format: unixtime` |
| `@encode("unixTimestamp", int64) _: utcDateTime` | `type: integer, format: unixtime` | `type: integer, format: unixtime` |
| `@encode("rfc3339") _: utcDateTime`              | `type: string, format: date-time` | `type: string, format: date-time` |
| `@encode("rfc7231") _: utcDateTime`              | `type: string, format: http-date` | `type: string, format: http-date` |
| `@encode("http-date") _: utcDateTime`            | `type: string, format: http-date` | `type: string, format: http-date` |

## Security Definitions

The OpenAPI emitter uses the [(http) `@useAuth` decorator](../../libraries/http/reference/decorators.md#@TypeSpec.Http.useAuth) to handle security definitions.

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
