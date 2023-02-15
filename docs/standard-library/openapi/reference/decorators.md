---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## OpenAPI

### `@operationId` {#@OpenAPI.operationId}

Specify the OpenAPI `operationId` property for this operation.

```typespec
dec OpenAPI.operationId(target: TypeSpec.Reflection.Operation, operationId: TypeSpec.string)
```

#### Target

`Operation`

#### Parameters

| Name        | Type                     | Description         |
| ----------- | ------------------------ | ------------------- |
| operationId | `scalar TypeSpec.string` | Operation id value. |

### `@extension` {#@OpenAPI.extension}

Attach some custom data to the OpenAPI element generated from this type.

```typespec
dec OpenAPI.extension(target: unknown, key: TypeSpec.string, value: unknown)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name  | Type                     | Description                         |
| ----- | ------------------------ | ----------------------------------- |
| key   | `scalar TypeSpec.string` | Extension key. Must start with `x-` |
| value | `(intrinsic) unknown`    | Extension value.                    |

### `@defaultResponse` {#@OpenAPI.defaultResponse}

Specify that this model is to be treated as the OpenAPI `default` response.
This differs from the compiler built-in `@error` decorator as this does not necessarily represent an error.

```typespec
dec OpenAPI.defaultResponse(target: TypeSpec.object)
```

#### Target

`model TypeSpec.object`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```typespec
@defaultResponse
model PetStoreResponse is object;

op listPets(): Pet[] | PetStoreResponse;
```

### `@externalDocs` {#@OpenAPI.externalDocs}

Specify the OpenAPI `externalDocs` property for this type.

```typespec
dec OpenAPI.externalDocs(target: unknown, url: TypeSpec.string, description?: TypeSpec.string)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name        | Type                     | Description             |
| ----------- | ------------------------ | ----------------------- |
| url         | `scalar TypeSpec.string` | Url to the docs         |
| description | `scalar TypeSpec.string` | Description of the docs |
