---
title: "Interfaces and Operations"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Interfaces and Operations

## TypeSpec.Rest.Resource

### `ExtensionResourceCollectionOperations` {#TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations}

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceCreate` {#TypeSpec.Rest.Resource.ExtensionResourceCreate}

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceCreate<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceCreateOrUpdate` {#TypeSpec.Rest.Resource.ExtensionResourceCreateOrUpdate}

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceCreateOrUpdate<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceDelete` {#TypeSpec.Rest.Resource.ExtensionResourceDelete}

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceDelete<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceInstanceOperations` {#TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations}

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceList` {#TypeSpec.Rest.Resource.ExtensionResourceList}

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceList<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceOperations` {#TypeSpec.Rest.Resource.ExtensionResourceOperations}

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceOperations<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceRead` {#TypeSpec.Rest.Resource.ExtensionResourceRead}

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceRead<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceUpdate` {#TypeSpec.Rest.Resource.ExtensionResourceUpdate}

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceUpdate<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ResourceCollectionOperations` {#TypeSpec.Rest.Resource.ResourceCollectionOperations}

```typespec
interface TypeSpec.Rest.Resource.ResourceCollectionOperations<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `ResourceCreate` {#TypeSpec.Rest.Resource.ResourceCreate}

```typespec
interface TypeSpec.Rest.Resource.ResourceCreate<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `ResourceCreateOrReplace` {#TypeSpec.Rest.Resource.ResourceCreateOrReplace}

```typespec
interface TypeSpec.Rest.Resource.ResourceCreateOrReplace<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `ResourceCreateOrUpdate` {#TypeSpec.Rest.Resource.ResourceCreateOrUpdate}

```typespec
interface TypeSpec.Rest.Resource.ResourceCreateOrUpdate<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `ResourceDelete` {#TypeSpec.Rest.Resource.ResourceDelete}

```typespec
interface TypeSpec.Rest.Resource.ResourceDelete<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `ResourceInstanceOperations` {#TypeSpec.Rest.Resource.ResourceInstanceOperations}

```typespec
interface TypeSpec.Rest.Resource.ResourceInstanceOperations<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `ResourceList` {#TypeSpec.Rest.Resource.ResourceList}

```typespec
interface TypeSpec.Rest.Resource.ResourceList<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `ResourceOperations` {#TypeSpec.Rest.Resource.ResourceOperations}

```typespec
interface TypeSpec.Rest.Resource.ResourceOperations<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `ResourceRead` {#TypeSpec.Rest.Resource.ResourceRead}

Represent the resource GET operation.

```typespec
interface TypeSpec.Rest.Resource.ResourceRead<TResource, TError>
```

#### Template Parameters

| Name      | Description         |
| --------- | ------------------- |
| TResource | The resource model. |
| TError    | The error response. |

### `ResourceUpdate` {#TypeSpec.Rest.Resource.ResourceUpdate}

```typespec
interface TypeSpec.Rest.Resource.ResourceUpdate<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `SingletonResourceOperations` {#TypeSpec.Rest.Resource.SingletonResourceOperations}

```typespec
interface TypeSpec.Rest.Resource.SingletonResourceOperations<TSingleton, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TSingleton |             |
| TResource  |             |
| TError     |             |

### `SingletonResourceRead` {#TypeSpec.Rest.Resource.SingletonResourceRead}

```typespec
interface TypeSpec.Rest.Resource.SingletonResourceRead<TSingleton, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TSingleton |             |
| TResource  |             |
| TError     |             |

### `SingletonResourceUpdate` {#TypeSpec.Rest.Resource.SingletonResourceUpdate}

```typespec
interface TypeSpec.Rest.Resource.SingletonResourceUpdate<TSingleton, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TSingleton |             |
| TResource  |             |
| TError     |             |
