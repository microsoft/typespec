---
title: Decorators
---

# OpenAPI Decorators

- [`@defaultResponse`](#defaultresponse)
- [`@extension`](#extension)
- [`@oneOf`](#oneof)
- [`@externalDocs`](#externaldocs)
- [`@operationId`](#operationid)
- [`@useRef`](#useref)

## `@defaultResponse`

**IMPORTANT This is to be used on `NON-ERROR` responses that cover all the other status codes. If you are looking to represent an error use [`@error`](https://microsoft.github.io/cadl/docs/standard-library/built-in-decorators/#error)**

Decorator that can be used on a response model to specify the `default` status code that OpenAPI allow.

```cadl
@defaultResponse
model MyNonErrorResponse {}

op foo(): MyNonErrorResponse;
```

## `@extension`

This decorator lets you specify custom key(starting with `x-`) value pair that will be added to the OpenAPI document.
[OpenAPI reference on extensions](https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#specificationExtensions)

Arguments:

| Name    | foo          | Description                                                      |
| ------- | ------------ | ---------------------------------------------------------------- |
| `key`   | **Required** | Extension key. **MUST** start with `x-`                          |
| `value` | **Required** | Value of the extension. Can be an primitive, a tuple or a model. |

```cadl
@extension("x-custom", "MyCustomValue")
model Foo {}

// Value can be an model.
@extension(
  "x-custom",
  {
    some: "value",
  }
)
model Foo {}
```

## `@externalDocs`

Decorator that can be used to provide the `externalDocs` property on OpenAPI elements.
[OpenAPI spec for externalDocs](https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#externalDocumentationObject)

Arguments:

| Name          | foo          | Description                      |
| ------------- | ------------ | -------------------------------- |
| `url`         | **Required** | Url for the external docs        |
| `description` | **Optional** | Description of the documentation |

```cadl
@externalDocs("https://example.com", "More info there")
model Foo {}
```

### @oneOf

Syntax:

```cadl
@oneOf()
```

`@oneOf`emits `oneOf` keyword for a union type in the resulting OpenAPI 3.0 specification. It indicates that the value of union type can only contain exactly one of the subschemas.

`@oneOf` can only be applied to a union types.

## `@operationId`

Decorator that can be used on an operation to specify the `operationId` field in OpenAPI. If this is not provided the `operationId` will be the cadl operation name.

Arguments:

| Name   | foo          | Description         |
| ------ | ------------ | ------------------- |
| `opId` | **Required** | Id of the operation |

```cadl
@operationId("custom_Foo")
op foo(): string;
```

### @useRef

Syntax:

```cadl
@useRef(urlString)
```

`@useRef`

`@useRef` is used to replace the Cadl model type in emitter output with a pre-existing named OpenAPI schema.
