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

Metadata to a single tag that is used by operations.

```typespec
model TypeSpec.OpenAPI.TagMetadata
```

#### Properties

| Name          | Type                                                            | Description                              |
| ------------- | --------------------------------------------------------------- | ---------------------------------------- |
| description?  | `string`                                                        | A description of the API.                |
| externalDocs? | [`ExternalDocs`](./data-types.md#TypeSpec.OpenAPI.ExternalDocs) | An external Docs information of the API. |
