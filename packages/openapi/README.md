# TypeSpec OpenAPI Library

This package provide [TypeSpec](https://github.com/microsoft/typespec) decorators to specify some OpenAPI specific concepts.

## Install

In your typespec project root

```bash
npm install @typespec/openapi
```

## Usage

```typespec
import "@typespec/openapi";

using OpenAPI;
```

## References

Decorators:

- [`@defaultResponse`](#defaultResponse)
- [`@extension`](#extension)
- [`@externalDocs`](#externalDocs)
- [`@operationId`](#operationId)

### `@defaultResponse`

**IMPORTANT This is to be used on `NON-ERROR` responses that cover all the other status codes. If you are looking to represent an error use [`@error`](https://microsoft.github.io/typespec/docs/standard-library/built-in-decorators/#error)**

Decorator that can be used on a response model to specify the `default` status code that OpenAPI allow.

```typespec
@defaultResponse
model MyNonErrorResponse {}

op foo(): MyNonErrorResponse;
```

### `@extension`

This decorator lets you specify custom key(starting with `x-`) value pair that will be added to the OpenAPI document.
[OpenAPI reference on extensions](https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#specificationExtensions)

Arguments:

| Name    | foo          | Description                                                      |
| ------- | ------------ | ---------------------------------------------------------------- |
| `key`   | **Required** | Extension key. **MUST** start with `x-`                          |
| `value` | **Required** | Value of the extension. Can be an primitive, a tuple or a model. |

```typespec
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

### `@externalDocs`

Decorator that can be used to provide the `externalDocs` property on OpenAPI elements.
[OpenAPI spec for externalDocs](https://github.com/OAI/OpenAPI-Specification/blob/3.0.3/versions/3.0.3.md#externalDocumentationObject)

Arguments:

| Name          | foo          | Description                      |
| ------------- | ------------ | -------------------------------- |
| `url`         | **Required** | Url for the external docs        |
| `description` | **Optional** | Description of the documentation |

```typespec
@externalDocs("https://example.com", "More info there")
model Foo {}
```

### `@operationId`

Decorator that can be used on an operation to specify the `operationId` field in OpenAPI. If this is not provided the `operationId` will be the typespec operation name.

Arguments:

| Name   | foo          | Description         |
| ------ | ------------ | ------------------- |
| `opId` | **Required** | Id of the operation |

```typespec
@operationId("custom_Foo")
op foo(): string;
```

## See also

- [TypeSpec Getting Started](https://github.com/microsoft/typespec#getting-started)
- [TypeSpec Website](https://microsoft.github.io/typespec)
- [TypeSpec for the OpenAPI Developer](https://github.com/microsoft/typespec/blob/main/docs/typespec-for-openapi-dev.md)
