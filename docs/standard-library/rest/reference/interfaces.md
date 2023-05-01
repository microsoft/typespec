---
title: "Interfaces and Operations"
toc_min_heading_level: 2
toc_max_heading_level: 3
---

# Interfaces and Operations

## TypeSpec.Rest.Resource

### `ExtensionResourceCollectionOperations` {#TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations}

Extension resource operation templates for extension resource collections.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description                   |
| ---------- | ----------------------------- |
| TExtension | The extension resource model. |
| TResource  | The resource model.           |
| TError     | The error response.           |

### `ExtensionResourceCreate` {#TypeSpec.Rest.Resource.ExtensionResourceCreate}

Extension resource create operation template.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceCreate<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description                   |
| ---------- | ----------------------------- |
| TExtension | The extension resource model. |
| TResource  | The resource model.           |
| TError     | The error response.           |

### `ExtensionResourceCreateOrUpdate` {#TypeSpec.Rest.Resource.ExtensionResourceCreateOrUpdate}

Extension resource create or update operation template.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceCreateOrUpdate<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description                   |
| ---------- | ----------------------------- |
| TExtension | The extension resource model. |
| TResource  | The resource model.           |
| TError     | The error response.           |

### `ExtensionResourceDelete` {#TypeSpec.Rest.Resource.ExtensionResourceDelete}

Extension resource delete operation template.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceDelete<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description                   |
| ---------- | ----------------------------- |
| TExtension | The extension resource model. |
| TResource  | The resource model.           |
| TError     | The error response.           |

### `ExtensionResourceInstanceOperations` {#TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations}

Extension resource operation templates for extension resource instances.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description                   |
| ---------- | ----------------------------- |
| TExtension | The extension resource model. |
| TResource  | The resource model.           |
| TError     | The error response.           |

### `ExtensionResourceList` {#TypeSpec.Rest.Resource.ExtensionResourceList}

Extension resource list operation template.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceList<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description                   |
| ---------- | ----------------------------- |
| TExtension | The extension resource model. |
| TResource  | The resource model.           |
| TError     | The error response.           |

### `ExtensionResourceOperations` {#TypeSpec.Rest.Resource.ExtensionResourceOperations}

Extension resource operation templates for extension resource instances and collections.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceOperations<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description                   |
| ---------- | ----------------------------- |
| TExtension | The extension resource model. |
| TResource  | The resource model.           |
| TError     | The error response.           |

### `ExtensionResourceRead` {#TypeSpec.Rest.Resource.ExtensionResourceRead}

Extension resource read operation template.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceRead<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description                   |
| ---------- | ----------------------------- |
| TExtension | The extension resource model. |
| TResource  | The resource model.           |
| TError     | The error response.           |

### `ExtensionResourceUpdate` {#TypeSpec.Rest.Resource.ExtensionResourceUpdate}

Extension resource update operation template.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceUpdate<TExtension, TResource, TError>
```

#### Template Parameters

| Name       | Description                   |
| ---------- | ----------------------------- |
| TExtension | The extension resource model. |
| TResource  | The resource model.           |
| TError     | The error response.           |

### `ResourceCollectionOperations` {#TypeSpec.Rest.Resource.ResourceCollectionOperations}

Resource operation templates for resource collections.

```typespec
interface TypeSpec.Rest.Resource.ResourceCollectionOperations<TResource, TError>
```

#### Template Parameters

| Name      | Description         |
| --------- | ------------------- |
| TResource | The resource model. |
| TError    | The error response. |

### `ResourceCreate` {#TypeSpec.Rest.Resource.ResourceCreate}

Resource create operation template.

```typespec
interface TypeSpec.Rest.Resource.ResourceCreate<TResource, TError>
```

#### Template Parameters

| Name      | Description                   |
| --------- | ----------------------------- |
| TResource | The resource model to create. |
| TError    | The error response.           |

### `ResourceCreateOrReplace` {#TypeSpec.Rest.Resource.ResourceCreateOrReplace}

Resource create or replace operation template.

```typespec
interface TypeSpec.Rest.Resource.ResourceCreateOrReplace<TResource, TError>
```

#### Template Parameters

| Name      | Description                              |
| --------- | ---------------------------------------- |
| TResource | The resource model to create or replace. |
| TError    | The error response.                      |

### `ResourceCreateOrUpdate` {#TypeSpec.Rest.Resource.ResourceCreateOrUpdate}

Resource create or update operation template.

```typespec
interface TypeSpec.Rest.Resource.ResourceCreateOrUpdate<TResource, TError>
```

#### Template Parameters

| Name      | Description                             |
| --------- | --------------------------------------- |
| TResource | The resource model to create or update. |
| TError    | The error response.                     |

### `ResourceDelete` {#TypeSpec.Rest.Resource.ResourceDelete}

Resource delete operation template.

```typespec
interface TypeSpec.Rest.Resource.ResourceDelete<TResource, TError>
```

#### Template Parameters

| Name      | Description                   |
| --------- | ----------------------------- |
| TResource | The resource model to delete. |
| TError    | The error response.           |

### `ResourceInstanceOperations` {#TypeSpec.Rest.Resource.ResourceInstanceOperations}

Resource operation templates for resource instances.

```typespec
interface TypeSpec.Rest.Resource.ResourceInstanceOperations<TResource, TError>
```

#### Template Parameters

| Name      | Description         |
| --------- | ------------------- |
| TResource | The resource model. |
| TError    | The error response. |

### `ResourceList` {#TypeSpec.Rest.Resource.ResourceList}

Resource list operation template.

```typespec
interface TypeSpec.Rest.Resource.ResourceList<TResource, TError>
```

#### Template Parameters

| Name      | Description                 |
| --------- | --------------------------- |
| TResource | The resource model to list. |
| TError    | The error response.         |

### `ResourceOperations` {#TypeSpec.Rest.Resource.ResourceOperations}

Resource operation templates for resources.

```typespec
interface TypeSpec.Rest.Resource.ResourceOperations<TResource, TError>
```

#### Template Parameters

| Name      | Description         |
| --------- | ------------------- |
| TResource | The resource model. |
| TError    | The error response. |

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

Resource update operation template.

```typespec
interface TypeSpec.Rest.Resource.ResourceUpdate<TResource, TError>
```

#### Template Parameters

| Name      | Description                   |
| --------- | ----------------------------- |
| TResource | The resource model to update. |
| TError    | The error response.           |

### `SingletonResourceOperations` {#TypeSpec.Rest.Resource.SingletonResourceOperations}

Singleton resource operation templates for singleton resource instances.

```typespec
interface TypeSpec.Rest.Resource.SingletonResourceOperations<TSingleton, TResource, TError>
```

#### Template Parameters

| Name       | Description                   |
| ---------- | ----------------------------- |
| TSingleton | The singleton resource model. |
| TResource  | The resource model.           |
| TError     | The error response.           |

### `SingletonResourceRead` {#TypeSpec.Rest.Resource.SingletonResourceRead}

Singleton resource read operation template.

```typespec
interface TypeSpec.Rest.Resource.SingletonResourceRead<TSingleton, TResource, TError>
```

#### Template Parameters

| Name       | Description                   |
| ---------- | ----------------------------- |
| TSingleton | The singleton resource model. |
| TResource  | The resource model.           |
| TError     | The error response.           |

### `SingletonResourceUpdate` {#TypeSpec.Rest.Resource.SingletonResourceUpdate}

Singleton resource update operation template.

```typespec
interface TypeSpec.Rest.Resource.SingletonResourceUpdate<TSingleton, TResource, TError>
```

#### Template Parameters

| Name       | Description                   |
| ---------- | ----------------------------- |
| TSingleton | The singleton resource model. |
| TResource  | The resource model.           |
| TError     | The error response.           |
