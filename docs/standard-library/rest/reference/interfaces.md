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

#### `ExtensionResourceCollectionOperations.create` {#TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations.create}

Creates a new instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<TResource>): TExtension | TypeSpec.Rest.Resource.ResourceCreatedResponse<T> | TError
```

#### `ExtensionResourceCollectionOperations.list` {#TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations.list}

Lists all instances of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<T> | TError
```

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

#### `ExtensionResourceCreate.create` {#TypeSpec.Rest.Resource.ExtensionResourceCreate.create}

Creates a new instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceCreate.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<TResource>): TExtension | TypeSpec.Rest.Resource.ResourceCreatedResponse<T> | TError
```

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

#### `ExtensionResourceCreateOrUpdate.createOrUpdate` {#TypeSpec.Rest.Resource.ExtensionResourceCreateOrUpdate.createOrUpdate}

Creates or update an instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceCreateOrUpdate.createOrUpdate(resource: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<TResource>): TExtension | TypeSpec.Rest.Resource.ResourceCreatedResponse<T> | TError
```

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

#### `ExtensionResourceDelete.delete` {#TypeSpec.Rest.Resource.ExtensionResourceDelete.delete}

Deletes an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceDelete.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | TError
```

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

#### `ExtensionResourceInstanceOperations.get` {#TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations.get}

Gets an instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations.get(): TExtension | TError
```

#### `ExtensionResourceInstanceOperations.update` {#TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations.update}

Updates an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<TResource>): TExtension | TError
```

#### `ExtensionResourceInstanceOperations.delete` {#TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations.delete}

Deletes an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | TError
```

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

#### `ExtensionResourceList.list` {#TypeSpec.Rest.Resource.ExtensionResourceList.list}

Lists all instances of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceList.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<T> | TError
```

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

#### `ExtensionResourceOperations.get` {#TypeSpec.Rest.Resource.ExtensionResourceOperations.get}

Gets an instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceOperations.get(): TExtension | TError
```

#### `ExtensionResourceOperations.update` {#TypeSpec.Rest.Resource.ExtensionResourceOperations.update}

Updates an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceOperations.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<TResource>): TExtension | TError
```

#### `ExtensionResourceOperations.delete` {#TypeSpec.Rest.Resource.ExtensionResourceOperations.delete}

Deletes an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceOperations.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | TError
```

#### `ExtensionResourceOperations.create` {#TypeSpec.Rest.Resource.ExtensionResourceOperations.create}

Creates a new instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceOperations.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<TResource>): TExtension | TypeSpec.Rest.Resource.ResourceCreatedResponse<T> | TError
```

#### `ExtensionResourceOperations.list` {#TypeSpec.Rest.Resource.ExtensionResourceOperations.list}

Lists all instances of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceOperations.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<T> | TError
```

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

#### `ExtensionResourceRead.get` {#TypeSpec.Rest.Resource.ExtensionResourceRead.get}

Gets an instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceRead.get(): TExtension | TError
```

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

#### `ExtensionResourceUpdate.update` {#TypeSpec.Rest.Resource.ExtensionResourceUpdate.update}

Updates an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceUpdate.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<TResource>): TExtension | TError
```

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

#### `ResourceCollectionOperations.create` {#TypeSpec.Rest.Resource.ResourceCollectionOperations.create}

Creates a new instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceCollectionOperations.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<TResource>): TResource | TypeSpec.Rest.Resource.ResourceCreatedResponse<T> | TError
```

#### `ResourceCollectionOperations.list` {#TypeSpec.Rest.Resource.ResourceCollectionOperations.list}

Lists all instances of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceCollectionOperations.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<T> | TError
```

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

#### `ResourceCreate.create` {#TypeSpec.Rest.Resource.ResourceCreate.create}

Creates a new instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceCreate.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<TResource>): TResource | TypeSpec.Rest.Resource.ResourceCreatedResponse<T> | TError
```

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

#### `ResourceCreateOrReplace.createOrReplace` {#TypeSpec.Rest.Resource.ResourceCreateOrReplace.createOrReplace}

Creates or replaces a instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceCreateOrReplace.createOrReplace(resource: TypeSpec.Rest.Resource.ResourceCreateModel<TResource>): TResource | TypeSpec.Rest.Resource.ResourceCreatedResponse<T> | TError
```

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

#### `ResourceCreateOrUpdate.createOrUpdate` {#TypeSpec.Rest.Resource.ResourceCreateOrUpdate.createOrUpdate}

Creates or update an instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceCreateOrUpdate.createOrUpdate(resource: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<TResource>): TResource | TypeSpec.Rest.Resource.ResourceCreatedResponse<T> | TError
```

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

#### `ResourceDelete.delete` {#TypeSpec.Rest.Resource.ResourceDelete.delete}

Deletes an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceDelete.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | TError
```

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

#### `ResourceInstanceOperations.get` {#TypeSpec.Rest.Resource.ResourceInstanceOperations.get}

Gets an instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceInstanceOperations.get(): TResource | TError
```

#### `ResourceInstanceOperations.update` {#TypeSpec.Rest.Resource.ResourceInstanceOperations.update}

Updates an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceInstanceOperations.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<TResource>): TResource | TError
```

#### `ResourceInstanceOperations.delete` {#TypeSpec.Rest.Resource.ResourceInstanceOperations.delete}

Deletes an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceInstanceOperations.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | TError
```

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

#### `ResourceList.list` {#TypeSpec.Rest.Resource.ResourceList.list}

Lists all instances of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceList.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<T> | TError
```

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

#### `ResourceOperations.get` {#TypeSpec.Rest.Resource.ResourceOperations.get}

Gets an instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceOperations.get(): TResource | TError
```

#### `ResourceOperations.update` {#TypeSpec.Rest.Resource.ResourceOperations.update}

Updates an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceOperations.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<TResource>): TResource | TError
```

#### `ResourceOperations.delete` {#TypeSpec.Rest.Resource.ResourceOperations.delete}

Deletes an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceOperations.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | TError
```

#### `ResourceOperations.create` {#TypeSpec.Rest.Resource.ResourceOperations.create}

Creates a new instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceOperations.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<TResource>): TResource | TypeSpec.Rest.Resource.ResourceCreatedResponse<T> | TError
```

#### `ResourceOperations.list` {#TypeSpec.Rest.Resource.ResourceOperations.list}

Lists all instances of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceOperations.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<T> | TError
```

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

#### `ResourceRead.get` {#TypeSpec.Rest.Resource.ResourceRead.get}

Gets an instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceRead.get(): TResource | TError
```

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

#### `ResourceUpdate.update` {#TypeSpec.Rest.Resource.ResourceUpdate.update}

Updates an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceUpdate.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<TResource>): TResource | TError
```

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

#### `SingletonResourceOperations.get` {#TypeSpec.Rest.Resource.SingletonResourceOperations.get}

Gets the singleton resource.

```typespec
op TypeSpec.Rest.Resource.SingletonResourceOperations.get(): TSingleton | TError
```

#### `SingletonResourceOperations.update` {#TypeSpec.Rest.Resource.SingletonResourceOperations.update}

Updates the singleton resource.

```typespec
op TypeSpec.Rest.Resource.SingletonResourceOperations.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<TResource>): TSingleton | TError
```

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

#### `SingletonResourceRead.get` {#TypeSpec.Rest.Resource.SingletonResourceRead.get}

Gets the singleton resource.

```typespec
op TypeSpec.Rest.Resource.SingletonResourceRead.get(): TSingleton | TError
```

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

#### `SingletonResourceUpdate.update` {#TypeSpec.Rest.Resource.SingletonResourceUpdate.update}

Updates the singleton resource.

```typespec
op TypeSpec.Rest.Resource.SingletonResourceUpdate.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<TResource>): TSingleton | TError
```
