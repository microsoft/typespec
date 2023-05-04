---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## OpenAPI

### `@defaultResponse` {#@OpenAPI.defaultResponse}

Specify that this model is to be treated as the OpenAPI `default` response.
This differs from the compiler built-in `@error` decorator as this does not necessarily represent an error.

```typespec
dec OpenAPI.defaultResponse(target: object)
```

#### Target

`model object`

#### Parameters

None

#### Examples

```typespec
@defaultResponse
model PetStoreResponse is object;

op listPets(): Pet[] | PetStoreResponse;
```

### `@extension` {#@OpenAPI.extension}

Attach some custom data to the OpenAPI element generated from this type.

```typespec
dec OpenAPI.extension(target: unknown, key: string, value: unknown)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name  | Type                  | Description                         |
| ----- | --------------------- | ----------------------------------- |
| key   | `scalar string`       | Extension key. Must start with `x-` |
| value | `(intrinsic) unknown` | Extension value.                    |

### `@externalDocs` {#@OpenAPI.externalDocs}

Specify the OpenAPI `externalDocs` property for this type.

```typespec
dec OpenAPI.externalDocs(target: unknown, url: string, description?: string)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name        | Type            | Description             |
| ----------- | --------------- | ----------------------- |
| url         | `scalar string` | Url to the docs         |
| description | `scalar string` | Description of the docs |

### `@operationId` {#@OpenAPI.operationId}

Specify the OpenAPI `operationId` property for this operation.

```typespec
dec OpenAPI.operationId(target: Operation, operationId: string)
```

#### Target

`Operation`

#### Parameters

| Name        | Type            | Description         |
| ----------- | --------------- | ------------------- |
| operationId | `scalar string` | Operation id value. |
