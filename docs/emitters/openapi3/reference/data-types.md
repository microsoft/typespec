---
title: "Data types"
---

## TypeSpec.OpenAPI

### `ExternalDocs` {#TypeSpec.OpenAPI.ExternalDocs}

External Docs information.

```typespec
model TypeSpec.OpenAPI.ExternalDocs
```

#### Properties

| Name         | Type     | Description          |
| ------------ | -------- | -------------------- |
| url          | `string` | Documentation url    |
| description? | `string` | Optional description |

### `TagMetadata` {#TypeSpec.OpenAPI.TagMetadata}

Additional information for the OpenAPI document.

```typespec
model TypeSpec.OpenAPI.TagMetadata
```

#### Properties

| Name          | Type                                                            | Description                             |
| ------------- | --------------------------------------------------------------- | --------------------------------------- |
| description?  | `string`                                                        | A description of the API.               |
| externalDocs? | [`ExternalDocs`](./data-types.md#TypeSpec.OpenAPI.ExternalDocs) | a external Docs information of the API. |
