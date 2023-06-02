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
@OpenAPI.defaultResponse
```

#### Target

`Model`

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
@OpenAPI.extension(key: string, value: unknown)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name  | Type                  | Description                         |
| ----- | --------------------- | ----------------------------------- |
| key   | `scalar string`       | Extension key. Must start with `x-` |
| value | `(intrinsic) unknown` | Extension value.                    |

#### Examples

```typespec
@extension("x-custom", "My value")
@extension("x-pageable", {nextLink: "x-next-link"})
op read(): string;
```

### `@externalDocs` {#@OpenAPI.externalDocs}

Specify the OpenAPI `externalDocs` property for this type.

```typespec
@OpenAPI.externalDocs(url: string, description?: string)
```

#### Target

`(intrinsic) unknown`

#### Parameters

| Name        | Type            | Description             |
| ----------- | --------------- | ----------------------- |
| url         | `scalar string` | Url to the docs         |
| description | `scalar string` | Description of the docs |

#### Examples

```typespec
@externalDocs("https://example.com/detailed.md", "Detailed information on how to use this operation")
op listPets(): Pet[];
```

### `@operationId` {#@OpenAPI.operationId}

Specify the OpenAPI `operationId` property for this operation.

```typespec
@OpenAPI.operationId(operationId: string)
```

#### Target

`Operation`

#### Parameters

| Name        | Type            | Description         |
| ----------- | --------------- | ------------------- |
| operationId | `scalar string` | Operation id value. |

#### Examples

```typespec
@operationId("download")
op read(): string;
```
