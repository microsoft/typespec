---
title: "Data types"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Data types

## TypeSpec.Rest.Resource

### `CollectionWithNextLink` {#TypeSpec.Rest.Resource.CollectionWithNextLink}

Structure for a paging response using `value` and `nextLink` to represent pagination.
This only provides the model structure and not actual pagination support.
See https://github.com/microsoft/typespec/issues/705 for general paging support.

```typespec
model CollectionWithNextLink<T>
```

#### Template Parameters

| Name | Description |
| ---- | ----------- |
| T    |             |

### `KeysOf` {#TypeSpec.Rest.Resource.KeysOf}

```typespec
model KeysOf<T>
```

#### Template Parameters

| Name | Description |
| ---- | ----------- |
| T    |             |

### `ParentKeysOf` {#TypeSpec.Rest.Resource.ParentKeysOf}

```typespec
model ParentKeysOf<T>
```

#### Template Parameters

| Name | Description |
| ---- | ----------- |
| T    |             |

### `ResourceCollectionParameters` {#TypeSpec.Rest.Resource.ResourceCollectionParameters}

```typespec
model ResourceCollectionParameters<TResource>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |

### `ResourceCreatedResponse` {#TypeSpec.Rest.Resource.ResourceCreatedResponse}

```typespec
model ResourceCreatedResponse<T>
```

#### Template Parameters

| Name | Description |
| ---- | ----------- |
| T    |             |

### `ResourceCreateModel` {#TypeSpec.Rest.Resource.ResourceCreateModel}

```typespec
model ResourceCreateModel<TResource>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |

### `ResourceCreateOrUpdateModel` {#TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel}

```typespec
model ResourceCreateOrUpdateModel<TResource>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |

### `ResourceDeletedResponse` {#TypeSpec.Rest.Resource.ResourceDeletedResponse}

Resource deleted successfully.

```typespec
model TypeSpec.Rest.Resource.ResourceDeletedResponse
```

### `ResourceError` {#TypeSpec.Rest.Resource.ResourceError}

The default error response for resource operations.

```typespec
model TypeSpec.Rest.Resource.ResourceError
```

### `ResourceParameters` {#TypeSpec.Rest.Resource.ResourceParameters}

```typespec
model ResourceParameters<TResource>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
