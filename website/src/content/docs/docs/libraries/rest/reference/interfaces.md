---
title: "Interfaces and Operations"
description: "Interfaces and Operations exported by @typespec/rest"
llmstxt: true
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

#### `ExtensionResourceCollectionOperations.create` {#TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations<Extension, Resource, Error>.create}

Creates a new instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations<Extension, Resource, Error>.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<Resource>): Extension | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
```

#### `ExtensionResourceCollectionOperations.list` {#TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations<Extension, Resource, Error>.list}

Lists all instances of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceCollectionOperations<Extension, Resource, Error>.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<Resource> | Error
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

#### `ExtensionResourceCreate.create` {#TypeSpec.Rest.Resource.ExtensionResourceCreate<Extension, Resource, Error>.create}

Creates a new instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceCreate<Extension, Resource, Error>.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<Resource>): Extension | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
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

#### `ExtensionResourceCreateOrUpdate.createOrUpdate` {#TypeSpec.Rest.Resource.ExtensionResourceCreateOrUpdate<Extension, Resource, Error>.createOrUpdate}

Creates or update an instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceCreateOrUpdate<Extension, Resource, Error>.createOrUpdate(resource: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Extension | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
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

#### `ExtensionResourceDelete.delete` {#TypeSpec.Rest.Resource.ExtensionResourceDelete<Extension, Resource, Error>.delete}

Deletes an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceDelete<Extension, Resource, Error>.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | Error
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

#### `ExtensionResourceInstanceOperations.get` {#TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations<Extension, Resource, Error>.get}

Gets an instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations<Extension, Resource, Error>.get(): Extension | Error
```

#### `ExtensionResourceInstanceOperations.update` {#TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations<Extension, Resource, Error>.update}

Updates an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations<Extension, Resource, Error>.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Extension | Error
```

#### `ExtensionResourceInstanceOperations.delete` {#TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations<Extension, Resource, Error>.delete}

Deletes an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceInstanceOperations<Extension, Resource, Error>.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | Error
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

#### `ExtensionResourceList.list` {#TypeSpec.Rest.Resource.ExtensionResourceList<Extension, Resource, Error>.list}

Lists all instances of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceList<Extension, Resource, Error>.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<Resource> | Error
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

#### `ExtensionResourceOperations.get` {#TypeSpec.Rest.Resource.ExtensionResourceOperations<Extension, Resource, Error>.get}

Gets an instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceOperations<Extension, Resource, Error>.get(): Extension | Error
```

#### `ExtensionResourceOperations.update` {#TypeSpec.Rest.Resource.ExtensionResourceOperations<Extension, Resource, Error>.update}

Updates an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceOperations<Extension, Resource, Error>.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Extension | Error
```

#### `ExtensionResourceOperations.delete` {#TypeSpec.Rest.Resource.ExtensionResourceOperations<Extension, Resource, Error>.delete}

Deletes an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceOperations<Extension, Resource, Error>.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | Error
```

#### `ExtensionResourceOperations.create` {#TypeSpec.Rest.Resource.ExtensionResourceOperations<Extension, Resource, Error>.create}

Creates a new instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceOperations<Extension, Resource, Error>.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<Resource>): Extension | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
```

#### `ExtensionResourceOperations.list` {#TypeSpec.Rest.Resource.ExtensionResourceOperations<Extension, Resource, Error>.list}

Lists all instances of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceOperations<Extension, Resource, Error>.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<Resource> | Error
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

#### `ExtensionResourceRead.get` {#TypeSpec.Rest.Resource.ExtensionResourceRead<Extension, Resource, Error>.get}

Gets an instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceRead<Extension, Resource, Error>.get(): Extension | Error
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

#### `ExtensionResourceUpdate.update` {#TypeSpec.Rest.Resource.ExtensionResourceUpdate<Extension, Resource, Error>.update}

Updates an existing instance of the extension resource.

```typespec
op TypeSpec.Rest.Resource.ExtensionResourceUpdate<Extension, Resource, Error>.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Extension | Error
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

#### `ResourceCollectionOperations.create` {#TypeSpec.Rest.Resource.ResourceCollectionOperations<Resource, Error>.create}

Creates a new instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceCollectionOperations<Resource, Error>.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<Resource>): Resource | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
```

#### `ResourceCollectionOperations.list` {#TypeSpec.Rest.Resource.ResourceCollectionOperations<Resource, Error>.list}

Lists all instances of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceCollectionOperations<Resource, Error>.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<Resource> | Error
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

#### `ResourceCreate.create` {#TypeSpec.Rest.Resource.ResourceCreate<Resource, Error>.create}

Creates a new instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceCreate<Resource, Error>.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<Resource>): Resource | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
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

#### `ResourceCreateOrReplace.createOrReplace` {#TypeSpec.Rest.Resource.ResourceCreateOrReplace<Resource, Error>.createOrReplace}

Creates or replaces a instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceCreateOrReplace<Resource, Error>.createOrReplace(resource: TypeSpec.Rest.Resource.ResourceCreateModel<Resource>): Resource | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
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

#### `ResourceCreateOrUpdate.createOrUpdate` {#TypeSpec.Rest.Resource.ResourceCreateOrUpdate<Resource, Error>.createOrUpdate}

Creates or update an instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceCreateOrUpdate<Resource, Error>.createOrUpdate(resource: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Resource | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
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

#### `ResourceDelete.delete` {#TypeSpec.Rest.Resource.ResourceDelete<Resource, Error>.delete}

Deletes an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceDelete<Resource, Error>.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | Error
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

#### `ResourceInstanceOperations.get` {#TypeSpec.Rest.Resource.ResourceInstanceOperations<Resource, Error>.get}

Gets an instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceInstanceOperations<Resource, Error>.get(): Resource | Error
```

#### `ResourceInstanceOperations.update` {#TypeSpec.Rest.Resource.ResourceInstanceOperations<Resource, Error>.update}

Updates an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceInstanceOperations<Resource, Error>.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Resource | Error
```

#### `ResourceInstanceOperations.delete` {#TypeSpec.Rest.Resource.ResourceInstanceOperations<Resource, Error>.delete}

Deletes an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceInstanceOperations<Resource, Error>.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | Error
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

#### `ResourceList.list` {#TypeSpec.Rest.Resource.ResourceList<Resource, Error>.list}

Lists all instances of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceList<Resource, Error>.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<Resource> | Error
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

#### `ResourceOperations.get` {#TypeSpec.Rest.Resource.ResourceOperations<Resource, Error>.get}

Gets an instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceOperations<Resource, Error>.get(): Resource | Error
```

#### `ResourceOperations.update` {#TypeSpec.Rest.Resource.ResourceOperations<Resource, Error>.update}

Updates an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceOperations<Resource, Error>.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Resource | Error
```

#### `ResourceOperations.delete` {#TypeSpec.Rest.Resource.ResourceOperations<Resource, Error>.delete}

Deletes an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceOperations<Resource, Error>.delete(): TypeSpec.Rest.Resource.ResourceDeletedResponse | Error
```

#### `ResourceOperations.create` {#TypeSpec.Rest.Resource.ResourceOperations<Resource, Error>.create}

Creates a new instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceOperations<Resource, Error>.create(resource: TypeSpec.Rest.Resource.ResourceCreateModel<Resource>): Resource | TypeSpec.Rest.Resource.ResourceCreatedResponse<Resource> | Error
```

#### `ResourceOperations.list` {#TypeSpec.Rest.Resource.ResourceOperations<Resource, Error>.list}

Lists all instances of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceOperations<Resource, Error>.list(): TypeSpec.Rest.Resource.CollectionWithNextLink<Resource> | Error
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

#### `ResourceRead.get` {#TypeSpec.Rest.Resource.ResourceRead<Resource, Error>.get}

Gets an instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceRead<Resource, Error>.get(): Resource | Error
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

#### `ResourceUpdate.update` {#TypeSpec.Rest.Resource.ResourceUpdate<Resource, Error>.update}

Updates an existing instance of the resource.

```typespec
op TypeSpec.Rest.Resource.ResourceUpdate<Resource, Error>.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Resource | Error
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

#### `SingletonResourceOperations.get` {#TypeSpec.Rest.Resource.SingletonResourceOperations<Singleton, Resource, Error>.get}

Gets the singleton resource.

```typespec
op TypeSpec.Rest.Resource.SingletonResourceOperations<Singleton, Resource, Error>.get(): Singleton | Error
```

#### `SingletonResourceOperations.update` {#TypeSpec.Rest.Resource.SingletonResourceOperations<Singleton, Resource, Error>.update}

Updates the singleton resource.

```typespec
op TypeSpec.Rest.Resource.SingletonResourceOperations<Singleton, Resource, Error>.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Singleton | Error
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

#### `SingletonResourceRead.get` {#TypeSpec.Rest.Resource.SingletonResourceRead<Singleton, Resource, Error>.get}

Gets the singleton resource.

```typespec
op TypeSpec.Rest.Resource.SingletonResourceRead<Singleton, Resource, Error>.get(): Singleton | Error
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

#### `SingletonResourceUpdate.update` {#TypeSpec.Rest.Resource.SingletonResourceUpdate<Singleton, Resource, Error>.update}

Updates the singleton resource.

```typespec
op TypeSpec.Rest.Resource.SingletonResourceUpdate<Singleton, Resource, Error>.update(properties: TypeSpec.Rest.Resource.ResourceCreateOrUpdateModel<Resource>): Singleton | Error
```
