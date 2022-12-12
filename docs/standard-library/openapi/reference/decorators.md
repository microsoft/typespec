---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## OpenAPI

### `@operationId` {#@OpenAPI.operationId}

```cadl
dec OpenAPI.operationId(target: Cadl.Reflection.Operation, operationId: Cadl.string)
```

#### Target

`Operation`

#### Parameters

| Name        | Type                 | Description         |
| ----------- | -------------------- | ------------------- |
| operationId | `scalar Cadl.string` | Operation id value. |

### `@extension` {#@OpenAPI.extension}

```cadl
dec OpenAPI.extension(target: unknown, key: Cadl.string, value: unknown)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name  | Type                  | Description                         |
| ----- | --------------------- | ----------------------------------- |
| key   | `scalar Cadl.string`  | Extension key. Must start with `x-` |
| value | `(intrinsic) unknown` | Extension value.                    |

### `@defaultResponse` {#@OpenAPI.defaultResponse}

```cadl
dec OpenAPI.defaultResponse(target: Cadl.object)
```

#### Target

`model Cadl.object`

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |

#### Examples

```cadl
@defaultResponse
model PetStoreResponse is object;

op listPets(): Pet[] | PetStoreResponse;
```

### `@externalDocs` {#@OpenAPI.externalDocs}

```cadl
dec OpenAPI.externalDocs(target: unknown, url: Cadl.string, description?: Cadl.string)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name        | Type                 | Description             |
| ----------- | -------------------- | ----------------------- |
| url         | `scalar Cadl.string` | Url to the docs         |
| description | `scalar Cadl.string` | Description of the docs |
