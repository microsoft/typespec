---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Decorators

## OpenAPI

### `@operationId` {#@OpenAPI.operationId}

Specify the OpenAPI `operationId` property for this operation.

```cadl
dec OpenAPI.operationId(target: Cadl.Reflection.Operation, operationId: Cadl.string)
```

#### Target

`Operation`

#### Parameters

| Name        | Type                 | Description         |
| ----------- | -------------------- | ------------------- |
| operationId | `scalar Cadl.string` | Operation id value. |

#### Examples

```cadl
@operationId("download")
op read(): string;
```

### `@extension` {#@OpenAPI.extension}

Attach some custom data to the OpenAPI element generated from this type.

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

#### Examples

```cadl
@extension("x-custom", "My value")
@extension("x-pageable", {nextLink: "x-next-link"})
op read(): string;
```

### `@defaultResponse` {#@OpenAPI.defaultResponse}

Specify that this model is to be treated as the OpenAPI `default` response.
This differs from the compiler built-in `@error` decorator as this does not necessarily represent an error.

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

Specify the OpenAPI `externalDocs` property for this type.

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

#### Examples

```cadl
@externalDocs("https://example.com/detailed.md", "Detailed information on how to use this operation")
op listPets(): Pet[];
```
