JS Api

# JS Api

## Table of contents

### Interfaces

- [ActionDetails](interfaces/ActionDetails.md)
- [AutoRouteOptions](interfaces/AutoRouteOptions.md)
- [FilteredRouteParam](interfaces/FilteredRouteParam.md)
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
- [$copyResourceKeyParameters](index.md#$copyresourcekeyparameters)
- [$createsOrReplacesResource](index.md#$createsorreplacesresource)
- [$createsOrUpdatesResource](index.md#$createsorupdatesresource)
- [$createsResource](index.md#$createsresource)
- [$deletesResource](index.md#$deletesresource)
- [$listsResource](index.md#$listsresource)
- [$onValidate](index.md#$onvalidate)
- [$parentResource](index.md#$parentresource)
- [$readsResource](index.md#$readsresource)
- [$resource](index.md#$resource)
- [$resourceLocation](index.md#$resourcelocation)
- [$resourceTypeForKeyParam](index.md#$resourcetypeforkeyparam)
- [$segment](index.md#$segment)
- [$segmentOf](index.md#$segmentof)
- [$updatesResource](index.md#$updatesresource)
- [getAction](index.md#getaction)
- [getActionDetails](index.md#getactiondetails)
- [getActionSegment](index.md#getactionsegment)
- [getActionSeparator](index.md#getactionseparator)
- [getCollectionAction](index.md#getcollectionaction)
- [getCollectionActionDetails](index.md#getcollectionactiondetails)
- [getParentResource](index.md#getparentresource)
- [getResourceLocationType](index.md#getresourcelocationtype)
- [getResourceOperation](index.md#getresourceoperation)
- [getResourceTypeForKeyParam](index.md#getresourcetypeforkeyparam)
- [getResourceTypeKey](index.md#getresourcetypekey)
- [getSegment](index.md#getsegment)
- [isAutoRoute](index.md#isautoroute)
- [isListOperation](index.md#islistoperation)
- [setResourceOperation](index.md#setresourceoperation)
- [setResourceTypeKey](index.md#setresourcetypekey)

## Type Aliases

### ResourceOperations

Ƭ **ResourceOperations**: ``"read"`` \| ``"create"`` \| ``"createOrReplace"`` \| ``"createOrUpdate"`` \| ``"update"`` \| ``"delete"`` \| ``"list"``

## Variables

### namespace

• `Const` **namespace**: ``"TypeSpec.Rest"``

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

`@autoRoute` enables automatic route generation for an operation or interface.

When applied to an operation, it automatically generates the operation's route based on path parameter
metadata.  When applied to an interface, it causes all operations under that scope to have
auto-generated routes.

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Interface` \| `Operation` |

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

### $copyResourceKeyParameters

▸ **$copyResourceKeyParameters**(`context`, `entity`, `filter?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `entity` | `Model` |
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
| `parentType` | `Model` |

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

**`Deprecated`**

Use getActionDetails instead.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |

#### Returns

`string` \| ``null`` \| `undefined`

___

### getActionDetails

▸ **getActionDetails**(`program`, `operation`): [`ActionDetails`](interfaces/ActionDetails.md) \| `undefined`

Gets the ActionDetails for the specified operation if it has previously been marked with @action.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |

#### Returns

[`ActionDetails`](interfaces/ActionDetails.md) \| `undefined`

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
| `program` | `Program` | the TypeSpec program |
| `entity` | `Type` | the target entity |

#### Returns

`string` \| `undefined`

the action separator string

___

### getCollectionAction

▸ **getCollectionAction**(`program`, `operation`): `string` \| ``null`` \| `undefined`

**`Deprecated`**

Use getCollectionActionDetails instead.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |

#### Returns

`string` \| ``null`` \| `undefined`

___

### getCollectionActionDetails

▸ **getCollectionActionDetails**(`program`, `operation`): [`ActionDetails`](interfaces/ActionDetails.md) \| `undefined`

Gets the ActionDetails for the specified operation if it has previously been marked with @collectionAction.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `operation` | `Operation` |

#### Returns

[`ActionDetails`](interfaces/ActionDetails.md) \| `undefined`

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

▸ **getResourceOperation**(`program`, `typespecOperation`): [`ResourceOperation`](interfaces/ResourceOperation.md) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `typespecOperation` | `Operation` |

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

### isAutoRoute

▸ **isAutoRoute**(`program`, `entity`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Interface` \| `Operation` |

#### Returns

`boolean`

___

### isListOperation

▸ **isListOperation**(`program`, `target`): `boolean`

Returns `true` if the given operation is marked as a list operation.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | the TypeSpec program |
| `target` | `Operation` | the target operation |

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
