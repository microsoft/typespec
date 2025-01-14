---
title: "Interfaces and Operations"
---

## TypeSpec.Rest.Resource

### `ExtensionResourceCollectionOperations` {#TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations}

Extension resource operation templates for extension resource collections.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations<Extension, Resource, Error>
```

#### Template Parameters

| Name      | Description                   |
| --------- | ----------------------------- |
| Extension | The extension resource model. |
| Resource  | The resource model.           |
| Error     | The error response.           |

#### `ExtensionResourceCollectionOperations.create` {#TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations.create}

Creates a new instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<Resource>): Extension | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
```

#### `ExtensionResourceCollectionOperations.list` {#TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations.list}

Lists all instances of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<Resource> | Error
```

### `ExtensionResourceCreate` {#TypeSpec.Rest.Resource.ExtensionResourceCreate}

Extension resource create operation template.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceCreate<Extension, Resource, Error>
```

#### Template Parameters

| Name      | Description                   |
| --------- | ----------------------------- |
| Extension | The extension resource model. |
| Resource  | The resource model.           |
| Error     | The error response.           |

#### `ExtensionResourceCreate.create` {#TypeSpec.Rest.Resource.ExtensionResourceCreate.create}

Creates a new instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceCreate.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<Resource>): Extension | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
```

### `ExtensionResourceCreateOrUpdate` {#TypeSpec.Rest.Resource.ExtensionResourceCreateOrUpdate}

Extension resource create or update operation template.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceCreateOrUpdate<Extension, Resource, Error>
```

#### Template Parameters

| Name      | Description                   |
| --------- | ----------------------------- |
| Extension | The extension resource model. |
| Resource  | The resource model.           |
| Error     | The error response.           |

#### `ExtensionResourceCreateOrUpdate.createOrUpdate` {#TypeSpec.Rest.Resource.ExtensionResourceCreateOrUpdate.createOrUpdate}

Creates or update an instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceCreateOrUpdate.createOrUpdate(resource: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Extension | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
```

### `ExtensionResourceDelete` {#TypeSpec.Rest.Resource.ExtensionResourceDelete}

Extension resource delete operation template.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceDelete<Extension, Resource, Error>
```

#### Template Parameters

| Name      | Description                   |
| --------- | ----------------------------- |
| Extension | The extension resource model. |
| Resource  | The resource model.           |
| Error     | The error response.           |

#### `ExtensionResourceDelete.delete` {#TypeSpec.Rest.Resource.ExtensionResourceDelete.delete}

Deletes an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceDelete.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | Error
```

### `ExtensionResourceInstanceOperations` {#TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations}

Extension resource operation templates for extension resource instances.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations<Extension, Resource, Error>
```

#### Template Parameters

| Name      | Description                   |
| --------- | ----------------------------- |
| Extension | The extension resource model. |
| Resource  | The resource model.           |
| Error     | The error response.           |

#### `ExtensionResourceInstanceOperations.get` {#TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations.get}

Gets an instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations.get(): Extension | Error
```

#### `ExtensionResourceInstanceOperations.update` {#TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations.update}

Updates an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Extension | Error
```

#### `ExtensionResourceInstanceOperations.delete` {#TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations.delete}

Deletes an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | Error
```

### `ExtensionResourceList` {#TypeSpec.Rest.Resource.ExtensionResourceList}

Extension resource list operation template.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceList<Extension, Resource, Error>
```

#### Template Parameters

| Name      | Description                   |
| --------- | ----------------------------- |
| Extension | The extension resource model. |
| Resource  | The resource model.           |
| Error     | The error response.           |

#### `ExtensionResourceList.list` {#TypeSpec.Rest.Resource.ExtensionResourceList.list}

Lists all instances of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceList.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<Resource> | Error
```

### `ExtensionResourceOperations` {#TypeSpec.Rest.Resource.ExtensionResourceOperations}

Extension resource operation templates for extension resource instances and collections.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceOperations<Extension, Resource, Error>
```

#### Template Parameters

| Name      | Description                   |
| --------- | ----------------------------- |
| Extension | The extension resource model. |
| Resource  | The resource model.           |
| Error     | The error response.           |

#### `ExtensionResourceOperations.get` {#TypeSpec.Rest.Resource.ExtensionResourceOperations.get}

Gets an instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceOperations.get(): Extension | Error
```

#### `ExtensionResourceOperations.update` {#TypeSpec.Rest.Resource.ExtensionResourceOperations.update}

Updates an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceOperations.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Extension | Error
```

#### `ExtensionResourceOperations.delete` {#TypeSpec.Rest.Resource.ExtensionResourceOperations.delete}

Deletes an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceOperations.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | Error
```

#### `ExtensionResourceOperations.create` {#TypeSpec.Rest.Resource.ExtensionResourceOperations.create}

Creates a new instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceOperations.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<Resource>): Extension | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
```

#### `ExtensionResourceOperations.list` {#TypeSpec.Rest.Resource.ExtensionResourceOperations.list}

Lists all instances of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceOperations.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<Resource> | Error
```

### `ExtensionResourceRead` {#TypeSpec.Rest.Resource.ExtensionResourceRead}

Extension resource read operation template.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceRead<Extension, Resource, Error>
```

#### Template Parameters

| Name      | Description                   |
| --------- | ----------------------------- |
| Extension | The extension resource model. |
| Resource  | The resource model.           |
| Error     | The error response.           |

#### `ExtensionResourceRead.get` {#TypeSpec.Rest.Resource.ExtensionResourceRead.get}

Gets an instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceRead.get(): Extension | Error
```

### `ExtensionResourceUpdate` {#TypeSpec.Rest.Resource.ExtensionResourceUpdate}

Extension resource update operation template.

```typespec
interface TypeSpec.Rest.Resource.ExtensionResourceUpdate<Extension, Resource, Error>
```

#### Template Parameters

| Name      | Description                   |
| --------- | ----------------------------- |
| Extension | The extension resource model. |
| Resource  | The resource model.           |
| Error     | The error response.           |

#### `ExtensionResourceUpdate.update` {#TypeSpec.Rest.Resource.ExtensionResourceUpdate.update}

Updates an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceUpdate.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Extension | Error
```

### `ResourceCollectionOperations` {#TypeSpec.Rest.Resource.ResourceCollectionOperations}

Resource operation templates for resource collections.

```typespec
interface TypeSpec.Rest.Resource.ResourceCollectionOperations<Resource, Error>
```

#### Template Parameters

| Name     | Description         |
| -------- | ------------------- |
| Resource | The resource model. |
| Error    | The error response. |

#### `ResourceCollectionOperations.create` {#TypeSpec.Rest.Resource.ResourceCollectionOperations.create}

Creates a new instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceCollectionOperations.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<Resource>): Resource | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
```

#### `ResourceCollectionOperations.list` {#TypeSpec.Rest.Resource.ResourceCollectionOperations.list}

Lists all instances of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceCollectionOperations.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<Resource> | Error
```

### `ResourceCreate` {#TypeSpec.Rest.Resource.ResourceCreate}

Resource create operation template.

```typespec
interface TypeSpec.Rest.Resource.ResourceCreate<Resource, Error>
```

#### Template Parameters

| Name     | Description                   |
| -------- | ----------------------------- |
| Resource | The resource model to create. |
| Error    | The error response.           |

#### `ResourceCreate.create` {#TypeSpec.Rest.Resource.ResourceCreate.create}

Creates a new instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceCreate.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<Resource>): Resource | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
```

### `ResourceCreateOrReplace` {#TypeSpec.Rest.Resource.ResourceCreateOrReplace}

Resource create or replace operation template.

```typespec
interface TypeSpec.Rest.Resource.ResourceCreateOrReplace<Resource, Error>
```

#### Template Parameters

| Name     | Description                              |
| -------- | ---------------------------------------- |
| Resource | The resource model to create or replace. |
| Error    | The error response.                      |

#### `ResourceCreateOrReplace.createOrReplace` {#TypeSpec.Rest.Resource.ResourceCreateOrReplace.createOrReplace}

Creates or replaces a instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceCreateOrReplace.createOrReplace(resource: TypeSpec.Rest.Resource.ResourceCreateModel<Resource>): Resource | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
```

### `ResourceCreateOrUpdate` {#TypeSpec.Rest.Resource.ResourceCreateOrUpdate}

Resource create or update operation template.

```typespec
interface TypeSpec.Rest.Resource.ResourceCreateOrUpdate<Resource, Error>
```

#### Template Parameters

| Name     | Description                             |
| -------- | --------------------------------------- |
| Resource | The resource model to create or update. |
| Error    | The error response.                     |

#### `ResourceCreateOrUpdate.createOrUpdate` {#TypeSpec.Rest.Resource.ResourceCreateOrUpdate.createOrUpdate}

Creates or update an instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceCreateOrUpdate.createOrUpdate(resource: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Resource | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
```

### `ResourceDelete` {#TypeSpec.Rest.Resource.ResourceDelete}

Resource delete operation template.

```typespec
interface TypeSpec.Rest.Resource.ResourceDelete<Resource, Error>
```

#### Template Parameters

| Name     | Description                   |
| -------- | ----------------------------- |
| Resource | The resource model to delete. |
| Error    | The error response.           |

#### `ResourceDelete.delete` {#TypeSpec.Rest.Resource.ResourceDelete.delete}

Deletes an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceDelete.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | Error
```

### `ResourceInstanceOperations` {#TypeSpec.Rest.Resource.ResourceInstanceOperations}

Resource operation templates for resource instances.

```typespec
interface TypeSpec.Rest.Resource.ResourceInstanceOperations<Resource, Error>
```

#### Template Parameters

| Name     | Description         |
| -------- | ------------------- |
| Resource | The resource model. |
| Error    | The error response. |

#### `ResourceInstanceOperations.get` {#TypeSpec.Rest.Resource.ResourceInstanceOperations.get}

Gets an instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceInstanceOperations.get(): Resource | Error
```

#### `ResourceInstanceOperations.update` {#TypeSpec.Rest.Resource.ResourceInstanceOperations.update}

Updates an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceInstanceOperations.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Resource | Error
```

#### `ResourceInstanceOperations.delete` {#TypeSpec.Rest.Resource.ResourceInstanceOperations.delete}

Deletes an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceInstanceOperations.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | Error
```

### `ResourceList` {#TypeSpec.Rest.Resource.ResourceList}

Resource list operation template.

```typespec
interface TypeSpec.Rest.Resource.ResourceList<Resource, Error>
```

#### Template Parameters

| Name     | Description                 |
| -------- | --------------------------- |
| Resource | The resource model to list. |
| Error    | The error response.         |

#### `ResourceList.list` {#TypeSpec.Rest.Resource.ResourceList.list}

Lists all instances of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceList.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<Resource> | Error
```

### `ResourceOperations` {#TypeSpec.Rest.Resource.ResourceOperations}

Resource operation templates for resources.

```typespec
interface TypeSpec.Rest.Resource.ResourceOperations<Resource, Error>
```

#### Template Parameters

| Name     | Description         |
| -------- | ------------------- |
| Resource | The resource model. |
| Error    | The error response. |

#### `ResourceOperations.get` {#TypeSpec.Rest.Resource.ResourceOperations.get}

Gets an instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceOperations.get(): Resource | Error
```

#### `ResourceOperations.update` {#TypeSpec.Rest.Resource.ResourceOperations.update}

Updates an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceOperations.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Resource | Error
```

#### `ResourceOperations.delete` {#TypeSpec.Rest.Resource.ResourceOperations.delete}

Deletes an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceOperations.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | Error
```

#### `ResourceOperations.create` {#TypeSpec.Rest.Resource.ResourceOperations.create}

Creates a new instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceOperations.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<Resource>): Resource | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
```

#### `ResourceOperations.list` {#TypeSpec.Rest.Resource.ResourceOperations.list}

Lists all instances of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceOperations.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<Resource> | Error
```

### `ResourceRead` {#TypeSpec.Rest.Resource.ResourceRead}

Represents the resource GET operation.

```typespec
interface TypeSpec.Rest.Resource.ResourceRead<Resource, Error>
```

#### Template Parameters

| Name     | Description         |
| -------- | ------------------- |
| Resource | The resource model. |
| Error    | The error response. |

#### `ResourceRead.get` {#TypeSpec.Rest.Resource.ResourceRead.get}

Gets an instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceRead.get(): Resource | Error
```

### `ResourceUpdate` {#TypeSpec.Rest.Resource.ResourceUpdate}

Resource update operation template.

```typespec
interface TypeSpec.Rest.Resource.ResourceUpdate<Resource, Error>
```

#### Template Parameters

| Name     | Description                   |
| -------- | ----------------------------- |
| Resource | The resource model to update. |
| Error    | The error response.           |

#### `ResourceUpdate.update` {#TypeSpec.Rest.Resource.ResourceUpdate.update}

Updates an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceUpdate.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Resource | Error
```

### `SingletonResourceOperations` {#TypeSpec.Rest.Resource.SingletonResourceOperations}

Singleton resource operation templates for singleton resource instances.

```typespec
interface TypeSpec.Rest.Resource.SingletonResourceOperations<Singleton, Resource, Error>
```

#### Template Parameters

| Name      | Description                   |
| --------- | ----------------------------- |
| Singleton | The singleton resource model. |
| Resource  | The resource model.           |
| Error     | The error response.           |

#### `SingletonResourceOperations.get` {#TypeSpec.Rest.Resource.SingletonResourceOperations.get}

Gets the singleton resource.

```typespec
op TypeSpec.Rest.Resource.SingletonResourceOperations.get(): Singleton | Error
```

#### `SingletonResourceOperations.update` {#TypeSpec.Rest.Resource.SingletonResourceOperations.update}

Updates the singleton resource.

```typespec
op TypeSpec.Rest.Resource.SingletonResourceOperations.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Singleton | Error
```

### `SingletonResourceRead` {#TypeSpec.Rest.Resource.SingletonResourceRead}

Singleton resource read operation template.

```typespec
interface TypeSpec.Rest.Resource.SingletonResourceRead<Singleton, Resource, Error>
```

#### Template Parameters

| Name      | Description                   |
| --------- | ----------------------------- |
| Singleton | The singleton resource model. |
| Resource  | The resource model.           |
| Error     | The error response.           |

#### `SingletonResourceRead.get` {#TypeSpec.Rest.Resource.SingletonResourceRead.get}

Gets the singleton resource.

```typespec
op TypeSpec.Rest.Resource.SingletonResourceRead.get(): Singleton | Error
```

### `SingletonResourceUpdate` {#TypeSpec.Rest.Resource.SingletonResourceUpdate}

Singleton resource update operation template.

```typespec
interface TypeSpec.Rest.Resource.SingletonResourceUpdate<Singleton, Resource, Error>
```

#### Template Parameters

| Name      | Description                   |
| --------- | ----------------------------- |
| Singleton | The singleton resource model. |
| Resource  | The resource model.           |
| Error     | The error response.           |

#### `SingletonResourceUpdate.update` {#TypeSpec.Rest.Resource.SingletonResourceUpdate.update}

Updates the singleton resource.

```typespec
op TypeSpec.Rest.Resource.SingletonResourceUpdate.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Singleton | Error
```
