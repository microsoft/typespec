---
title: "Decorators"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

## TypeSpec.OpenAPI

### `@defaultResponse` {#@TypeSpec.OpenAPI.defaultResponse}

Specify that this model is to be treated as the OpenAPI `default` response.
This differs from the compiler built-in `@error` decorator as this does not necessarily represent an error.

```typespec
@TypeSpec.OpenAPI.defaultResponse
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

### `@extension` {#@TypeSpec.OpenAPI.extension}

Attach some custom data to the OpenAPI element generated from this type.

```typespec
@TypeSpec.OpenAPI.extension(key: valueof string, value?: unknown)
```

#### Target

`unknown`

#### Parameters

| Name  | Type             | Description                                                                                                 |
| ----- | ---------------- | ----------------------------------------------------------------------------------------------------------- |
| key   | `valueof string` | minProperties/maxProperties/uniqueItems/multipleOf or Extension key. the extension key must start with `x-` |
| value | `unknown`        | Extension value.                                                                                            |

#### Examples

```typespec
@extension("x-custom", "My value")
@extension(
  "x-pageable",
  {
    nextLink: "x-next-link",
  }
)
op read(): string;
```

##### Specify that every item in the array must be unique.

```typespec
model Foo {
  @extension("uniqueItems")
  x: unknown[];
}
```

##### Specify that the numeric type must be a multiple of some numeric value.

```typespec
model Foo {
  @extension("multipleOf", 1)
  x: int32;
}
```

##### Specify the maximum number of properties this object can have.

```typespec
model Foo {
  @extension("maxProperties", 1)
  x: int32;
}
```

##### Specify the minimum number of properties this object can have.

```typespec
model Foo {
  @extension("minProperties", 1)
  x: int32;
}
```

### `@externalDocs` {#@TypeSpec.OpenAPI.externalDocs}

Specify the OpenAPI `externalDocs` property for this type.

```typespec
@TypeSpec.OpenAPI.externalDocs(url: valueof string, description?: valueof string)
```

#### Target

`unknown`

#### Parameters

| Name        | Type             | Description             |
| ----------- | ---------------- | ----------------------- |
| url         | `valueof string` | Url to the docs         |
| description | `valueof string` | Description of the docs |

#### Examples

```typespec
@externalDocs(
  "https://example.com/detailed.md",
  "Detailed information on how to use this operation"
)
op listPets(): Pet[];
```

### `@info` {#@TypeSpec.OpenAPI.info}

Specify OpenAPI additional information.
The service `title` and `version` are already specified using `@service`.

```typespec
@TypeSpec.OpenAPI.info(additionalInfo: TypeSpec.OpenAPI.AdditionalInfo)
```

#### Target

`Namespace`

#### Parameters

| Name           | Type                                                                | Description            |
| -------------- | ------------------------------------------------------------------- | ---------------------- |
| additionalInfo | [`AdditionalInfo`](./data-types.md#TypeSpec.OpenAPI.AdditionalInfo) | Additional information |

### `@operationId` {#@TypeSpec.OpenAPI.operationId}

Specify the OpenAPI `operationId` property for this operation.

```typespec
@TypeSpec.OpenAPI.operationId(operationId: valueof string)
```

#### Target

`Operation`

#### Parameters

| Name        | Type             | Description         |
| ----------- | ---------------- | ------------------- |
| operationId | `valueof string` | Operation id value. |

#### Examples

```typespec
@operationId("download")
op read(): string;
```

### `@tagMetadata` {#@TypeSpec.OpenAPI.tagMetadata}

Specify OpenAPI additional information.

```typespec
@TypeSpec.OpenAPI.tagMetadata(name: valueof string, tagMetadata: valueof TypeSpec.OpenAPI.TagMetadata)
```

#### Target

`Namespace`

#### Parameters

| Name        | Type                                                                  | Description            |
| ----------- | --------------------------------------------------------------------- | ---------------------- |
| name        | `valueof string`                                                      | tag name               |
| tagMetadata | [valueof `TagMetadata`](./data-types.md#TypeSpec.OpenAPI.TagMetadata) | Additional information |

#### Examples

```typespec
@service
@tagMetadata(
  "Tag Name",
  #{
    description: "Tag description",
    externalDocs: #{ url: "https://example.com", description: "More info.", `x-custom`: "string" },
    `x-custom`: "string",
  }
)
namespace PetStore {

}
```
