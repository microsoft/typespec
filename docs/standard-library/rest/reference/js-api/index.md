Documentation

# Documentation

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

#### Defined in

[rest.ts:259](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L259)

## Variables

### namespace

• `Const` **namespace**: ``"Cadl.Rest"``

#### Defined in

[index.ts:1](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/index.ts#L1)

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

#### Defined in

[rest.ts:375](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L375)

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

#### Defined in

[rest.ts:366](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L366)

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

#### Defined in

[rest.ts:206](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L206)

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

#### Defined in

[rest.ts:100](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L100)

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

#### Defined in

[rest.ts:387](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L387)

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

#### Defined in

[rest.ts:67](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L67)

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

#### Defined in

[resource.ts:129](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/resource.ts#L129)

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

#### Defined in

[rest.ts:314](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L314)

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

#### Defined in

[rest.ts:322](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L322)

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

#### Defined in

[rest.ts:303](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L303)

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

#### Defined in

[rest.ts:338](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L338)

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

#### Defined in

[rest.ts:346](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L346)

___

### $onValidate

▸ **$onValidate**(`program`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |

#### Returns

`void`

#### Defined in

[validate.ts:64](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/validate.ts#L64)

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

#### Defined in

[resource.ts:183](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/resource.ts#L183)

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

#### Defined in

[rest.ts:33](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L33)

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

#### Defined in

[rest.ts:299](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L299)

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

#### Defined in

[rest.ts:232](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L232)

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

#### Defined in

[rest.ts:422](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L422)

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

#### Defined in

[resource.ts:68](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/resource.ts#L68)

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

#### Defined in

[rest.ts:136](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L136)

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

#### Defined in

[rest.ts:152](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L152)

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

#### Defined in

[rest.ts:180](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L180)

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

#### Defined in

[rest.ts:330](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L330)

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

#### Defined in

[rest.ts:381](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L381)

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

#### Defined in

[rest.ts:370](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L370)

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

#### Defined in

[rest.ts:219](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L219)

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

#### Defined in

[rest.ts:413](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L413)

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

#### Defined in

[rest.ts:84](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L84)

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

#### Defined in

[resource.ts:170](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/resource.ts#L170)

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

#### Defined in

[rest.ts:50](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L50)

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

#### Defined in

[rest.ts:435](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L435)

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

#### Defined in

[rest.ts:292](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L292)

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

#### Defined in

[resource.ts:80](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/resource.ts#L80)

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

#### Defined in

[resource.ts:35](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/resource.ts#L35)

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

#### Defined in

[rest.ts:165](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L165)

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

#### Defined in

[rest.ts:194](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L194)

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

#### Defined in

[rest.ts:104](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L104)

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

#### Defined in

[rest.ts:275](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/rest.ts#L275)

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

#### Defined in

[resource.ts:24](https://github.com/timotheeguerin/cadl/blob/920bc86d/packages/rest/src/resource.ts#L24)
