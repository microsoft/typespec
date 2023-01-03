---
title: "Interfaces and Operations"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Interfaces and Operations

## Cadl.Rest.Resource

### `ResourceRead` {#Cadl.Rest.Resource.ResourceRead}

Represent the resource GET operation.

```cadl
interface Cadl.Rest.Resource.ResourceRead<TResource, TError>
```

#### Template Parameters

| Name      | Description         |
| --------- | ------------------- |
| TResource | The resource model. |
| TError    | The error response. |

### `ResourceCreateOrReplace` {#Cadl.Rest.Resource.ResourceCreateOrReplace}

```cadl
interface Cadl.Rest.Resource.ResourceCreateOrReplace<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `ResourceCreateOrUpdate` {#Cadl.Rest.Resource.ResourceCreateOrUpdate}

```cadl
interface Cadl.Rest.Resource.ResourceCreateOrUpdate<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `ResourceCreate` {#Cadl.Rest.Resource.ResourceCreate}

```cadl
interface Cadl.Rest.Resource.ResourceCreate<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `ResourceUpdate` {#Cadl.Rest.Resource.ResourceUpdate}

```cadl
interface Cadl.Rest.Resource.ResourceUpdate<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `ResourceDelete` {#Cadl.Rest.Resource.ResourceDelete}

```cadl
interface Cadl.Rest.Resource.ResourceDelete<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `ResourceList` {#Cadl.Rest.Resource.ResourceList}

```cadl
interface Cadl.Rest.Resource.ResourceList<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `ResourceInstanceOperations` {#Cadl.Rest.Resource.ResourceInstanceOperations}

```cadl
interface Cadl.Rest.Resource.ResourceInstanceOperations<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `ResourceCollectionOperations` {#Cadl.Rest.Resource.ResourceCollectionOperations}

```cadl
interface Cadl.Rest.Resource.ResourceCollectionOperations<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `ResourceOperations` {#Cadl.Rest.Resource.ResourceOperations}

```cadl
interface Cadl.Rest.Resource.ResourceOperations<TResource, TError>
```

#### Template Parameters

| Name      | Description |
| --------- | ----------- |
| TResource |             |
| TError    |             |

### `SingletonResourceRead` {#Cadl.Rest.Resource.SingletonResourceRead}

```cadl
interface Cadl.Rest.Resource.SingletonResourceRead<TSingleton, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TSingleton |             |
| TResource  |             |
| TError     |             |

### `SingletonResourceUpdate` {#Cadl.Rest.Resource.SingletonResourceUpdate}

```cadl
interface Cadl.Rest.Resource.SingletonResourceUpdate<TSingleton, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TSingleton |             |
| TResource  |             |
| TError     |             |

### `SingletonResourceOperations` {#Cadl.Rest.Resource.SingletonResourceOperations}

```cadl
interface Cadl.Rest.Resource.SingletonResourceOperations<TSingleton, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TSingleton |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceRead` {#Cadl.Rest.Resource.ExtensionResourceRead}

```cadl
interface Cadl.Rest.Resource.ExtensionResourceRead<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceCreateOrUpdate` {#Cadl.Rest.Resource.ExtensionResourceCreateOrUpdate}

```cadl
interface Cadl.Rest.Resource.ExtensionResourceCreateOrUpdate<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceCreate` {#Cadl.Rest.Resource.ExtensionResourceCreate}

```cadl
interface Cadl.Rest.Resource.ExtensionResourceCreate<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceUpdate` {#Cadl.Rest.Resource.ExtensionResourceUpdate}

```cadl
interface Cadl.Rest.Resource.ExtensionResourceUpdate<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceDelete` {#Cadl.Rest.Resource.ExtensionResourceDelete}

```cadl
interface Cadl.Rest.Resource.ExtensionResourceDelete<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceList` {#Cadl.Rest.Resource.ExtensionResourceList}

```cadl
interface Cadl.Rest.Resource.ExtensionResourceList<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceInstanceOperations` {#Cadl.Rest.Resource.ExtensionResourceInstanceOperations}

```cadl
interface Cadl.Rest.Resource.ExtensionResourceInstanceOperations<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceCollectionOperations` {#Cadl.Rest.Resource.ExtensionResourceCollectionOperations}

```cadl
interface Cadl.Rest.Resource.ExtensionResourceCollectionOperations<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |

### `ExtensionResourceOperations` {#Cadl.Rest.Resource.ExtensionResourceOperations}

```cadl
interface Cadl.Rest.Resource.ExtensionResourceOperations<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description |
| ---------- | ----------- |
| TExtension |             |
| TResource  |             |
| TError     |             |
