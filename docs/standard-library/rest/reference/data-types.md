---
title: "Data types"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Data types

## TypeSpec.Rest

### `ResourceLocation` {#TypeSpec.Rest.ResourceLocation}

A URL that points to a resource.

```typespec
scalar TypeSpec.Rest.ResourceLocation
```

## TypeSpec.Rest.Resource

### `CollectionWithNextLink` {#TypeSpec.Rest.Resource.CollectionWithNextLink}

Structure for a paging response using `value` and `nextLink` to represent pagination.
This only provides the model structure and not actual pagination support.
See https://github.com/microsoft/typespec/issues/705 for general paging support.

```typespec
model TypeSpec.Rest.Resource.CollectionWithNextLink<T>
```

#### Template Parameters

| Name | Description                          |
| ---- | ------------------------------------ |
| T    | The resource type of the collection. |

### `KeysOf` {#TypeSpec.Rest.Resource.KeysOf}

Dynamically gathers keys of the model type T.

```typespec
model TypeSpec.Rest.Resource.KeysOf<T>
```

#### Template Parameters

| Name | Description       |
| ---- | ----------------- |
| T    | The target model. |

### `ParentKeysOf` {#TypeSpec.Rest.Resource.ParentKeysOf}

Dynamically gathers parent keys of the model type T.

```typespec
model TypeSpec.Rest.Resource.ParentKeysOf<T>
```

#### Template Parameters

| Name | Description       |
| ---- | ----------------- |
| T    | The target model. |

### `ResourceCollectionParameters` {#TypeSpec.Rest.Resource.ResourceCollectionParameters}

Represents collection operation parameters for resource TResource.

```typespec
model TypeSpec.Rest.Resource.ResourceCollectionParameters<TResource>
```

#### Template Parameters

| Name      | Description         |
| --------- | ------------------- |
| TResource | The resource model. |

### `ResourceCreatedResponse` {#TypeSpec.Rest.Resource.ResourceCreatedResponse}

Resource create operation completed successfully.

```typespec
model TypeSpec.Rest.Resource.ResourceCreatedResponse<T>
```

#### Template Parameters

| Name | Description                          |
| ---- | ------------------------------------ |
| T    | The resource model that was created. |

### `ResourceCreateModel` {#TypeSpec.Rest.Resource.ResourceCreateModel}

Resource create operation model.

```typespec
model TypeSpec.Rest.Resource.ResourceCreateModel<TResource>
```

#### Template Parameters

| Name      | Description                   |
| --------- | ----------------------------- |
| TResource | The resource model to create. |

### `ResourceCreateOrUpdateModel` {#TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel}

Resource create or update operation model.

```typespec
model TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<TResource>
```

#### Template Parameters

| Name      | Description                             |
| --------- | --------------------------------------- |
| TResource | The resource model to create or update. |

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

Represents operation parameters for resource TResource.

```typespec
model TypeSpec.Rest.Resource.ResourceParameters<TResource>
```

#### Template Parameters

| Name      | Description         |
| --------- | ------------------- |
| TResource | The resource model. |
