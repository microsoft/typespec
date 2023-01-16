JS Api

# JS Api

## Table of contents

### Namespaces

- [http](modules/http.md)

### Interfaces

- [ResourceKey](interfaces/ResourceKey.md)
- [ResourceOperation](interfaces/ResourceOperation.md)

### Type Aliases

- [ResourceOperations](index.md#resourceoperations)

### Variables

- [namespace](index.md#namespace)

### Functions

- [$action](index.md#$action)
- [$actionSegment](index.md#$actionsegment)
- [$actionSeparator](index.md#$actionseparator)
- [$autoRoute](index.md#$autoroute)
- [$collectionAction](index.md#$collectionaction)
- [$consumes](index.md#$consumes)
- [$copyResourceKeyParameters](index.md#$copyresourcekeyparameters)
- [$createsOrReplacesResource](index.md#$createsorreplacesresource)
- [$createsOrUpdatesResource](index.md#$createsorupdatesresource)
- [$createsResource](index.md#$createsresource)
- [$deletesResource](index.md#$deletesresource)
- [$listsResource](index.md#$listsresource)
- [$onValidate](index.md#$onvalidate)
- [$parentResource](index.md#$parentresource)
- [$produces](index.md#$produces)
- [$readsResource](index.md#$readsresource)
- [$resource](index.md#$resource)
- [$resourceLocation](index.md#$resourcelocation)
- [$resourceTypeForKeyParam](index.md#$resourcetypeforkeyparam)
- [$segment](index.md#$segment)
- [$segmentOf](index.md#$segmentof)
- [$segmentSeparator](index.md#$segmentseparator)
- [$updatesResource](index.md#$updatesresource)
- [getAction](index.md#getaction)
- [getActionSegment](index.md#getactionsegment)
- [getActionSeparator](index.md#getactionseparator)
- [getCollectionAction](index.md#getcollectionaction)
- [getConsumes](index.md#getconsumes)
- [getParentResource](index.md#getparentresource)
- [getProduces](index.md#getproduces)
- [getResourceLocationType](index.md#getresourcelocationtype)
- [getResourceOperation](index.md#getresourceoperation)
- [getResourceTypeForKeyParam](index.md#getresourcetypeforkeyparam)
- [getResourceTypeKey](index.md#getresourcetypekey)
- [getSegment](index.md#getsegment)
- [getSegmentSeparator](index.md#getsegmentseparator)
- [isAutoRoute](index.md#isautoroute)
- [setResourceOperation](index.md#setresourceoperation)
- [setResourceTypeKey](index.md#setresourcetypekey)

## Type Aliases

### ResourceOperations

Ƭ **ResourceOperations**: ``"read"`` \| ``"create"`` \| ``"createOrReplace"`` \| ``"createOrUpdate"`` \| ``"update"`` \| ``"delete"`` \| ``"list"``

## Variables

### namespace

• `Const` **namespace**: ``"Cadl.Rest"``

## Functions

### $action

▸ **$action**(`context`, `entity`, `name?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |
| `name?` | `string` |

#### Returns

`void`

___

### $actionSegment

▸ **$actionSegment**(`context`, `entity`, `name`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |
| `name` | `string` |

#### Returns

`void`

___

### $actionSeparator

▸ **$actionSeparator**(`context`, `entity`, `separator`): `void`

`@actionSeparator` defines the separator string that is used to precede the action name
 in auto-generated actions.

`@actionSeparator` can only be applied to model properties, operation parameters, or operations.

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Model` \| `ModelProperty` \| `Operation` |
| `separator` | ``"/"`` \| ``":"`` \| ``"/:"`` |

#### Returns

`void`

___

### $autoRoute

▸ **$autoRoute**(`context`, `entity`): `void`

`@autoRoute` enables automatic route generation for an operation, namespace, or interface.

When applied to an operation, it automatically generates the operation's route based on path parameter
metadata.  When applied to a namespace or interface, it causes all operations under that scope to have
auto-generated routes.

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Interface` \| `Namespace` \| `Operation` |

#### Returns

`void`

___

### $collectionAction

▸ **$collectionAction**(`context`, `entity`, `resourceType`, `name?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |
| `resourceType` | `Model` |
| `name?` | `string` |

#### Returns

`void`

___

### $consumes

▸ **$consumes**(`context`, `entity`, `...contentTypes`): `void`

**`Deprecated`**

Use parameters `@header contentType` instead

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Namespace` |
| `...contentTypes` | `string`[] |

#### Returns

`void`

___

### $copyResourceKeyParameters

▸ **$copyResourceKeyParameters**(`context`, `entity`, `filter?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Type` |
| `filter?` | `string` |

#### Returns

`void`

___

### $createsOrReplacesResource

▸ **$createsOrReplacesResource**(`context`, `entity`, `resourceType`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |
| `resourceType` | `Model` |

#### Returns

`void`

___

### $createsOrUpdatesResource

▸ **$createsOrUpdatesResource**(`context`, `entity`, `resourceType`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |
| `resourceType` | `Model` |

#### Returns

`void`

___

### $createsResource

▸ **$createsResource**(`context`, `entity`, `resourceType`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |
| `resourceType` | `Model` |

#### Returns

`void`

___

### $deletesResource

▸ **$deletesResource**(`context`, `entity`, `resourceType`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |
| `resourceType` | `Model` |

#### Returns

`void`

___

### $listsResource

▸ **$listsResource**(`context`, `entity`, `resourceType`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |
| `resourceType` | `Model` |

#### Returns

`void`

___

### $onValidate

▸ **$onValidate**(`program`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |

#### Returns

`void`

___

### $parentResource

▸ **$parentResource**(`context`, `entity`, `parentType`): `void`

`@parentResource` marks a model with a reference to its parent resource type

The first argument should be a reference to a model type which will be treated as the parent
type of the target model type.  This will cause the `@key` properties of all parent types of
the target type to show up in operations of the `Resource*<T>` interfaces defined in this library.

`@parentResource` can only be applied to models.

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Type` |
| `parentType` | `Type` |

#### Returns

`void`

___

### $produces

▸ **$produces**(`context`, `entity`, `...contentTypes`): `void`

**`Deprecated`**

Use return type `@header contentType` property instead

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Namespace` |
| `...contentTypes` | `string`[] |

#### Returns

`void`

___

### $readsResource

▸ **$readsResource**(`context`, `entity`, `resourceType`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |
| `resourceType` | `Model` |

#### Returns

`void`

___

### $resource

▸ **$resource**(`context`, `entity`, `collectionName`): `void`

`@resource` marks a model as a resource type.

The first argument should be the name of the collection that the resources
belong to.  For example, a resource type `Widget` might have a collection
name of `widgets`.

`@resource` can only be applied to models.

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Model` |
| `collectionName` | `string` |

#### Returns

`void`

___

### $resourceLocation

▸ **$resourceLocation**(`context`, `entity`, `resourceType`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Model` |
| `resourceType` | `Model` |

#### Returns

`void`

___

### $resourceTypeForKeyParam

▸ **$resourceTypeForKeyParam**(`context`, `entity`, `resourceType`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Type` |
| `resourceType` | `Type` |

#### Returns

`void`

___

### $segment

▸ **$segment**(`context`, `entity`, `name`): `void`

`@segment` defines the preceding path segment for a `@path` parameter in auto-generated routes

The first argument should be a string that will be inserted into the operation route before the
path parameter's name field.

`@segment` can only be applied to model properties, operation parameters, or operations.

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Model` \| `ModelProperty` \| `Operation` |
| `name` | `string` |

#### Returns

`void`

___

### $segmentOf

▸ **$segmentOf**(`context`, `entity`, `resourceType`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |
| `resourceType` | `Model` |

#### Returns

`void`

___

### $segmentSeparator

▸ **$segmentSeparator**(`context`, `entity`, `separator`): `void`

`@segmentSeparator` defines the separator string that is inserted between the target's
`@segment` and the preceding route path in auto-generated routes.

The first argument should be a string that will be inserted into the operation route before the
target's `@segment` value.  Can be a string of any length.  Defaults to `/`.

`@segmentSeparator` can only be applied to model properties, operation parameters, or operations.

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Model` \| `ModelProperty` \| `Operation` |
| `separator` | `string` |

#### Returns

`void`

___

### $updatesResource

▸ **$updatesResource**(`context`, `entity`, `resourceType`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |
| `resourceType` | `Model` |

#### Returns

`void`

___

### getAction

▸ **getAction**(`program`, `operation`): `string` \| ``null`` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |

#### Returns

`string` \| ``null`` \| `undefined`

___

### getActionSegment

▸ **getActionSegment**(`program`, `entity`): `string` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

`string` \| `undefined`

___

### getActionSeparator

▸ **getActionSeparator**(`program`, `entity`): `string` \| `undefined`

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | the Cadl program |
| `entity` | `Type` | the target entity |

#### Returns

`string` \| `undefined`

the action separator string

___

### getCollectionAction

▸ **getCollectionAction**(`program`, `operation`): `string` \| ``null`` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |

#### Returns

`string` \| ``null`` \| `undefined`

___

### getConsumes

▸ **getConsumes**(`program`, `entity`): `string`[]

**`Deprecated`**

Check parameters `@header contentType` instead

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

`string`[]

___

### getParentResource

▸ **getParentResource**(`program`, `resourceType`): `Model` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `resourceType` | `Model` |

#### Returns

`Model` \| `undefined`

___

### getProduces

▸ **getProduces**(`program`, `entity`): `string`[]

**`Deprecated`**

Check return type `@header contentType` property instead

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

`string`[]

___

### getResourceLocationType

▸ **getResourceLocationType**(`program`, `entity`): `Model` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Scalar` |

#### Returns

`Model` \| `undefined`

___

### getResourceOperation

▸ **getResourceOperation**(`program`, `cadlOperation`): [`ResourceOperation`](interfaces/ResourceOperation.md) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `cadlOperation` | `Operation` |

#### Returns

[`ResourceOperation`](interfaces/ResourceOperation.md) \| `undefined`

___

### getResourceTypeForKeyParam

▸ **getResourceTypeForKeyParam**(`program`, `param`): `Model` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `param` | `ModelProperty` |

#### Returns

`Model` \| `undefined`

___

### getResourceTypeKey

▸ **getResourceTypeKey**(`program`, `resourceType`): [`ResourceKey`](interfaces/ResourceKey.md) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `resourceType` | `Model` |

#### Returns

[`ResourceKey`](interfaces/ResourceKey.md) \| `undefined`

___

### getSegment

▸ **getSegment**(`program`, `entity`): `string` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

`string` \| `undefined`

___

### getSegmentSeparator

▸ **getSegmentSeparator**(`program`, `entity`): `string` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Type` |

#### Returns

`string` \| `undefined`

___

### isAutoRoute

▸ **isAutoRoute**(`program`, `target`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `target` | `Interface` \| `Namespace` \| `Operation` |

#### Returns

`boolean`

___

### setResourceOperation

▸ **setResourceOperation**(`context`, `entity`, `resourceType`, `operation`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Operation` |
| `resourceType` | `Model` |
| `operation` | [`ResourceOperations`](index.md#resourceoperations) |

#### Returns

`void`

___

### setResourceTypeKey

▸ **setResourceTypeKey**(`program`, `resourceType`, `keyProperty`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `resourceType` | `Model` |
| `keyProperty` | `ModelProperty` |

#### Returns

`void`
