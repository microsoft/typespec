---
id: openapi
title: The OpenAPI v3 emitter
---

<!-- cspell:ignore cadl, openapi -->

# The Cadl OpenAPI v3 emitter

Cadl has an OpenAPI emitter called `@cadl-lang/openapi3` that emits a standard OpenAPI v3 description from Cadl source.
This can then be used as input in to any OpenAPI tooling.

## Install

In your Cadl project root

```bash
npm install @cadl-lang/openapi3
```

The OpenAPI emitter requires certain features of the Cadl HTTP library in the `@cadl-lang/rest` package, so this also
needs to be installed and imported somewhere in your Cadl source.

```bash
npm install @cadl-lang/rest
```

## Emit OpenAPI 3.0 definition

There are several ways to emit an OpenAPI 3.0 definition for your Cadl source file.

1. Via the command line

```bash
cadl compile . --emit @cadl-lang/openapi3
```

2. Via the config

Add the following to the `cadl-project.yaml` file.

```yaml
emitters:
  @cadl-lang/openapi3: true
```

### Emitter options

Emitter options can be passed on the command line with

```bash
--option "@cadl-lang/openapi3.<optionName>=<value>"

# For example
--option "@cadl-lang/openapi3.output-file=my-custom-openapi.json"
```

or configured via the `cadl-project.yaml` configuration:

```yaml
emitters:
  '@cadl-lang/openapi3':
    <optionName>: <value>

# For example
emitters:
  '@cadl-lang/openapi3':
    outputFile: my-custom-openapi.json
```

#### `output-file`

Configure the name of the swagger output file relative to the compiler `output-path`.

#### `new-line`

Set the newline character for emitting files. Can be either:

- `lf`(Default)
- `crlf`

### `omit-unreachable-types`

Only include types references via an operation.

## How the OpenAPI emitter interprets Cadl

The OpenAPI emitter converts Cadl language elements into their natural OpenAPI expression as described below.

### Operations

Each Cadl operation becomes an OpenAPI operation.

The HTTP method for the operation is either explicitly specified with an [(Http) `@get`, `@post`, `@put`, `@patch`, or `@delete` decorator][http-verb-decorators] on the operation or it is inferred from the operation name and signature.

The path for the operation comes from the [(Http) `@route` decorator][http-route-decorator] on the operation.
The `@route` decorator can also be specified on a namespace and/or an interface (group of operations).
When specified, the route for the enclosing namespace(s) and interface are prefixed to the operation route.

[http-verb-decorators]: https://github.com/microsoft/cadl/blob/main/packages/rest/README.md#decorators
[http-route-decorator]: https://github.com/microsoft/cadl/blob/main/packages/rest/README.md#:~:text=%40-,route,-operations%2C%20namespaces%2C%20interfaces

The fields of the [Operation object](https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#operationObject) are set as described below.

#### description

The description field is set from the [(built-in) `@doc` decorator][doc-decorator] on the Cadl operation, and omitted when `@doc` is not present.

[doc-decorator]: {%doc "built-in-decorators"%}#doc

#### summary

The summary field is set from the [(built-in) `@summary` decorator][summary-decorator] on the Cadl operation, and omitted when `@summary` is not present.

[summary-decorator]: {%doc "built-in-decorators"%}#summary

#### operationId

The operationId can be explicitly specified with the [(OpenAPI) `@operationId` decorator][openapi-operationid-decorator],
and otherwise is simple the operation name, prefixed with "<interface*name>*" when the operation is within an interface.

[openapi-operationid-decorator]: {%doc "built-in-decorators"%}#operationId

#### parameters and requestBody

The parameters of the Cadl operation are translated into the parameter list and requestBody for the OpenAPI operation.

The `in` field of a parameter is specified with an [(Http) `@query`, `@header`, or `@path` decorator][http-parameter-decorators].
A parameter without one of these decorators is assumed to be passed in the request body.

The request body parameter can also be explicitly decorated with an [(Http) `@body` decorator][http-body-decorator].
In the absence of explicit `@body`, the set of parameters that are not marked @header, @query, or @path form the request body.

[http-parameter-decorators]: https://github.com/microsoft/cadl/blob/main/packages/rest/README.md#decorators
[http-body-decorator]: https://github.com/microsoft/cadl/blob/main/packages/rest/README.md#decorators

A (built-in) `@doc` decorator on a parameter will be use in the description.

The Cadl parameter type will be translated into an appropriate OpenAPI schema for the parameter.

Likewise, the type of the body parameter(s) will be translated into an appropriate OpenAPI schema for the requestBody.
The request body will use the "application/json" media type unless the body model includes an explicit `content-type`
header.

See also [metadata]({%doc "http"%}#metadata) for more advanced details.

#### responses

The return type(s) of the Cadl operation are translated into responses for the OpenAPI operation.
The status code for a response can be specified as a property in the return type model with the [(Http) `@statusCode` decorator][http-statuscode-decorator] (the property name is ignored).
If the [(built-in) `@error` decorator][error-decorator] is specified on a return type, this return type because the default response for the operation.
The media type for a response will be "application/json" unless the return type model includes an explicit `content-type`
header.
Models with different status codes and/or media types can be unioned together to describe complex response designs.

When a return type model has a property explicitly decorated with an [(Http) `@body` decorator][http-body-decorator], this
is taken as the response body.
In the absence of explicit `@body`, the properties that are not marked `@statusCode` or `@header` form the response body.

[http-statuscode-decorator]: https://github.com/microsoft/cadl/blob/main/packages/rest/README.md#decorators

[error-decorator]: {%doc "built-in-decorators"%}#error

See also [metadata]({%doc "http"%}#metadata) for more advanced details.

#### tags

Any tags specified with the [(built-in) `@tag` decorator][tag-decorator] on the operation, interface, or
enclosing namespace(s) are included in the OpenAPI operation's tags array.

[tag-decorator]: {%doc "built-in-decorators"%}#tag

#### deprecated

If the [(built-in) `@deprecated` decorator][deprecated-decorator] is specified on the operation, then the operation's
deprecated field is set to true.

[deprecated-decorator]: {%doc "built-in-decorators"%}#deprecated

#### externalDocs

If the Cadl operation has an [(OpenAPI) `@externalDocs` decorator][openapi-externaldocs-decorator] this will produce
an externalDocs field in the OpenAPI operation.

[openapi-externaldocs-decorator]: https://github.com/microsoft/cadl/blob/main/packages/openapi/README.md#externaldocs

#### Specification extensions

Any extensions specified on the Cadl operation with the [(OpenAPI) `@extension` decorator][openapi-extension-decorator]
are included in the emitted OpenAPI operation.

[openapi-extension-decorator]: https://github.com/microsoft/cadl/blob/main/packages/openapi/README.md#extension

### Models and enums

Models and enums are converted into schemas in the generated OpenAPI definition. Intrinsic types in Cadl are represented
with a JSON Schema type that most closely matches the semantics of the Cadl type.

The following table shows how Cadl types are translated to JSON Schema types:

| Cadl type       | OpenAPI `type`/`format`           | Notes                                                                     |
| --------------- | --------------------------------- | ------------------------------------------------------------------------- |
| `int32`         | `type: integer, format: int32`    |                                                                           |
| `int64`         | `type: integer, format: int64`    |                                                                           |
| `float32`       | `type: number, format: float`     |                                                                           |
| `float64`       | `type: number, format: double`    |                                                                           |
| `string`        | `type: string`                    |                                                                           |
| `bytes`         | `type: string, format: byte`      | for content-type == 'application/json' or 'text/plain'                    |
| `bytes`         | `type: string, format: binary`    | for "binary" content types, e.g. 'application/octet-stream', 'image/jpeg' |
| `boolean`       | `type: boolean`                   |                                                                           |
| `plainDate`     | `type: string, format: date`      |                                                                           |
| `zonedDateTime` | `type: string, format: date-time` | RFC 3339 date                                                             |

There are a variety of decorators that can modify or add metadata to the definitions produced in the generated OpenAPI.

For a numeric element (integer or float):

| Cadl decorator     | OpenAPI/JSON Schema keyword | Notes |
| ------------------ | --------------------------- | ----- |
| `@minValue(value)` | `minimum: value`            |       |
| `@maxValue(value)` | `maximum: value`            |       |

For any element defined as a `string` or a type that extends from `string`:

| Cadl decorator      | OpenAPI/JSON Schema keyword | Notes                                                      |
| ------------------- | --------------------------- | ---------------------------------------------------------- |
| `@format(name)`     | `format: name`              | When format is not determined by type or another decorator |
| `@minLength(value)` | `minLength: value`          |                                                            |
| `@maxLength(value)` | `maxLength: value`          |                                                            |
| `@pattern(regex)`   | `pattern: regex`            |                                                            |
| `@secret`           | `format: password`          |                                                            |

For an array type:

| Cadl decorator     | OpenAPI/JSON Schema keyword | Notes |
| ------------------ | --------------------------- | ----- |
| `@minItems(value)` | `minItems: value`           |       |
| `@minItems(value)` | `maxItems: value`           |       |

Enums can be defined in Cadl with the [`enum` statement]({%doc "enums"%}), e.g.:

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

The OpenAPI emitter converts both of these into a schema definition containing an "enum" with the list of defined values.

### Model composition

Cadl has several mechanisms for model composition and extension. The following describes how these are handled in the openapi3 emitter.

#### Spread

The spread operator does not convey any semantic relationship between the source and target models so the openapi3 emitter
treats this as if the properties of the source model were explicitly included in the target model at the position where the
spread appears.

#### Extends

When one model extends another model, this is intended to convey and inheritance relationship. While OpenAPI has no formal
construct for inheritance, the openapi3 emitter represents this form of composition with an `allOf` in the schema of the child model
that references the schema for the parent model.

##### Extends with discriminator

The openapi3 emitter supports the `@discriminator(propertyName)` decorator on a `model`. This will produce a `discriminator` object
with the named property in the schema for this model.

Models that extend this model must define this property with a literal string value, and these values must be distinct across all the
models that extend this model. These values are used to construct a `mapping` for the discriminator.

The `@discriminator` decorator can be used to create multi-level discriminated inheritance but must use a different discriminated property at each level.

#### Is

The `is` keyword provides a form of composition similar to the spread operator, where no semantic relationship is conveyed between
the source and target models. The openapi3 emitter represents this form of composition with an independent schema that contains
all the same properties as the model named by the `is` keyword, plus any properties defined directly on the model.

#### Union

Unions are another form of model composition.

Unions can be defined in two different ways in Cadl. One way is with
[the union type operator]({%doc "unions"%}#union-expressions), `|`:

```cadl
alias GoodBreed = Beagle | GermanShepherd | GoldenRetriever;
```

The second way is with [the `union` statement]({%doc "unions"%}#named-unions)
which not only declares the variant models but also assigns a name for each.

```cadl
union GoodBreed {
  beagle: Beagle,
  shepherd: GermanShepherd,
  retriever: GoldenRetriever,
}
```

The openapi3 emitter represents either form of union with an `anyOf` with an element for each option of the union.
The openapi3 emitter ignores the "names" for variants in named unions.

The openapi3 emitter also defines the `@oneOf` decorator which can be specified on a `union` statement to indicate
that a union should be emitted as a `oneOf` rather than `anyOf`.

## See also

- [Cadl Getting Started](https://github.com/microsoft/cadl#getting-started)
- [Cadl Website](https://microsoft.github.io/cadl)
- [Cadl for the OpenAPI Developer](https://github.com/microsoft/cadl/blob/main/docs/cadl-for-openapi-dev.md)
