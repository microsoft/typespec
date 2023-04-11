JS Api

# JS Api

## Table of contents

### Enumerations

- [Availability](enums/Availability.md)

### Classes

- [VersionMap](classes/VersionMap.md)

### Interfaces

- [Version](interfaces/Version.md)
- [VersionResolution](interfaces/VersionResolution.md)

### Variables

- [namespace](index.md#namespace)

### Functions

- [$added](index.md#$added)
- [$madeOptional](index.md#$madeoptional)
- [$onValidate](index.md#$onvalidate)
- [$removed](index.md#$removed)
- [$renamedFrom](index.md#$renamedfrom)
- [$returnTypeChangedFrom](index.md#$returntypechangedfrom)
- [$typeChangedFrom](index.md#$typechangedfrom)
- [$useDependency](index.md#$usedependency)
- [$versioned](index.md#$versioned)
- [buildVersionProjections](index.md#buildversionprojections)
- [existsAtVersion](index.md#existsatversion)
- [findVersionedNamespace](index.md#findversionednamespace)
- [getAddedOnVersions](index.md#getaddedonversions)
- [getAvailabilityMap](index.md#getavailabilitymap)
- [getAvailabilityMapInTimeline](index.md#getavailabilitymapintimeline)
- [getMadeOptionalOn](index.md#getmadeoptionalon)
- [getNameAtVersion](index.md#getnameatversion)
- [getRemovedOnVersions](index.md#getremovedonversions)
- [getRenamedFromVersions](index.md#getrenamedfromversions)
- [getReturnTypeBeforeVersion](index.md#getreturntypebeforeversion)
- [getReturnTypeChangedFrom](index.md#getreturntypechangedfrom)
- [getTypeBeforeVersion](index.md#gettypebeforeversion)
- [getTypeChangedFrom](index.md#gettypechangedfrom)
- [getUseDependencies](index.md#getusedependencies)
- [getVersion](index.md#getversion)
- [getVersionDependencies](index.md#getversiondependencies)
- [getVersionForEnumMember](index.md#getversionforenummember)
- [getVersions](index.md#getversions)
- [getVersionsForEnum](index.md#getversionsforenum)
- [hasDifferentNameAtVersion](index.md#hasdifferentnameatversion)
- [hasDifferentReturnTypeAtVersion](index.md#hasdifferentreturntypeatversion)
- [hasDifferentTypeAtVersion](index.md#hasdifferenttypeatversion)
- [indexTimeline](index.md#indextimeline)
- [madeOptionalAfter](index.md#madeoptionalafter)
- [resolveVersions](index.md#resolveversions)

## Variables

### namespace

• `Const` **namespace**: ``"TypeSpec.Versioning"``

## Functions

### $added

▸ **$added**(`context`, `t`, `v`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `t` | `Type` |
| `v` | `EnumMember` |

#### Returns

`void`

___

### $madeOptional

▸ **$madeOptional**(`context`, `t`, `v`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `t` | `ModelProperty` |
| `v` | `EnumMember` |

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

### $removed

▸ **$removed**(`context`, `t`, `v`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `t` | `Type` |
| `v` | `EnumMember` |

#### Returns

`void`

___

### $renamedFrom

▸ **$renamedFrom**(`context`, `t`, `v`, `oldName`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `t` | `Type` |
| `v` | `EnumMember` |
| `oldName` | `string` |

#### Returns

`void`

___

### $returnTypeChangedFrom

▸ **$returnTypeChangedFrom**(`context`, `op`, `v`, `oldReturnType`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `op` | `Operation` |
| `v` | `EnumMember` |
| `oldReturnType` | `any` |

#### Returns

`void`

___

### $typeChangedFrom

▸ **$typeChangedFrom**(`context`, `prop`, `v`, `oldType`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `prop` | `ModelProperty` |
| `v` | `EnumMember` |
| `oldType` | `any` |

#### Returns

`void`

___

### $useDependency

▸ **$useDependency**(`context`, `target`, `...versionRecords`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `target` | `EnumMember` \| `Namespace` |
| `...versionRecords` | `EnumMember`[] |

#### Returns

`void`

___

### $versioned

▸ **$versioned**(`context`, `t`, `versions`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `context` | `DecoratorContext` |
| `t` | `Namespace` |
| `versions` | `Enum` |

#### Returns

`void`

___

### buildVersionProjections

▸ **buildVersionProjections**(`program`, `rootNs`): `VersionProjections`[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `rootNs` | `Namespace` |

#### Returns

`VersionProjections`[]

___

### existsAtVersion

▸ **existsAtVersion**(`p`, `type`, `versionKey`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `p` | `Program` |
| `type` | `Type` |
| `versionKey` | `ObjectType` |

#### Returns

`boolean`

___

### findVersionedNamespace

▸ **findVersionedNamespace**(`program`, `namespace`): `Namespace` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `namespace` | `Namespace` |

#### Returns

`Namespace` \| `undefined`

___

### getAddedOnVersions

▸ **getAddedOnVersions**(`p`, `t`): [`Version`](interfaces/Version.md)[] \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `p` | `Program` |
| `t` | `Type` |

#### Returns

[`Version`](interfaces/Version.md)[] \| `undefined`

___

### getAvailabilityMap

▸ **getAvailabilityMap**(`program`, `type`): `Map`<`string`, [`Availability`](enums/Availability.md)\> \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `type` | `Type` |

#### Returns

`Map`<`string`, [`Availability`](enums/Availability.md)\> \| `undefined`

___

### getAvailabilityMapInTimeline

▸ **getAvailabilityMapInTimeline**(`program`, `type`, `timeline`): `Map`<`TimelineMoment`, [`Availability`](enums/Availability.md)\> \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `type` | `Type` |
| `timeline` | `VersioningTimeline` |

#### Returns

`Map`<`TimelineMoment`, [`Availability`](enums/Availability.md)\> \| `undefined`

___

### getMadeOptionalOn

▸ **getMadeOptionalOn**(`p`, `t`): [`Version`](interfaces/Version.md) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `p` | `Program` |
| `t` | `Type` |

#### Returns

[`Version`](interfaces/Version.md) \| `undefined`

version when the given type was made optional if applicable.

___

### getNameAtVersion

▸ **getNameAtVersion**(`p`, `t`, `versionKey`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `p` | `Program` |
| `t` | `Type` |
| `versionKey` | `ObjectType` |

#### Returns

`string`

get old name if applicable.

___

### getRemovedOnVersions

▸ **getRemovedOnVersions**(`p`, `t`): [`Version`](interfaces/Version.md)[] \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `p` | `Program` |
| `t` | `Type` |

#### Returns

[`Version`](interfaces/Version.md)[] \| `undefined`

___

### getRenamedFromVersions

▸ **getRenamedFromVersions**(`p`, `t`): [`Version`](interfaces/Version.md)[] \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `p` | `Program` |
| `t` | `Type` |

#### Returns

[`Version`](interfaces/Version.md)[] \| `undefined`

the list of versions for which this decorator has been applied

___

### getReturnTypeBeforeVersion

▸ **getReturnTypeBeforeVersion**(`p`, `t`, `versionKey`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `p` | `Program` |
| `t` | `Type` |
| `versionKey` | `ObjectType` |

#### Returns

`any`

get old type if applicable.

___

### getReturnTypeChangedFrom

▸ **getReturnTypeChangedFrom**(`p`, `t`): `Map`<[`Version`](interfaces/Version.md), `Type`\> \| `undefined`

Returns the mapping of versions to old return type values, if applicable

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `p` | `Program` | TypeSpec program |
| `t` | `Type` | type to query |

#### Returns

`Map`<[`Version`](interfaces/Version.md), `Type`\> \| `undefined`

Map of versions to old types, if any

___

### getTypeBeforeVersion

▸ **getTypeBeforeVersion**(`p`, `t`, `versionKey`): `Type` \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `p` | `Program` |
| `t` | `Type` |
| `versionKey` | `ObjectType` |

#### Returns

`Type` \| `undefined`

get old type if applicable.

___

### getTypeChangedFrom

▸ **getTypeChangedFrom**(`p`, `t`): `Map`<[`Version`](interfaces/Version.md), `Type`\> \| `undefined`

Returns the mapping of versions to old type values, if applicable

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `p` | `Program` | TypeSpec program |
| `t` | `Type` | type to query |

#### Returns

`Map`<[`Version`](interfaces/Version.md), `Type`\> \| `undefined`

Map of versions to old types, if any

___

### getUseDependencies

▸ **getUseDependencies**(`program`, `target`, `searchEnum?`): `Map`<`Namespace`, `Map`<[`Version`](interfaces/Version.md), [`Version`](interfaces/Version.md)\> \| [`Version`](interfaces/Version.md)\> \| `undefined`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `program` | `Program` | `undefined` |
| `target` | `Enum` \| `Namespace` | `undefined` |
| `searchEnum` | `boolean` | `true` |

#### Returns

`Map`<`Namespace`, `Map`<[`Version`](interfaces/Version.md), [`Version`](interfaces/Version.md)\> \| [`Version`](interfaces/Version.md)\> \| `undefined`

___

### getVersion

▸ **getVersion**(`program`, `namespace`): [`VersionMap`](classes/VersionMap.md) \| `undefined`

Get the version map of the namespace.

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `namespace` | `Namespace` |

#### Returns

[`VersionMap`](classes/VersionMap.md) \| `undefined`

___

### getVersionDependencies

▸ **getVersionDependencies**(`program`, `namespace`): `Map`<`Namespace`, `Map`<[`Version`](interfaces/Version.md), [`Version`](interfaces/Version.md)\> \| [`Version`](interfaces/Version.md)\> \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `namespace` | `Namespace` |

#### Returns

`Map`<`Namespace`, `Map`<[`Version`](interfaces/Version.md), [`Version`](interfaces/Version.md)\> \| [`Version`](interfaces/Version.md)\> \| `undefined`

___

### getVersionForEnumMember

▸ **getVersionForEnumMember**(`program`, `member`): [`Version`](interfaces/Version.md) \| `undefined`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `member` | `EnumMember` |

#### Returns

[`Version`](interfaces/Version.md) \| `undefined`

___

### getVersions

▸ **getVersions**(`p`, `t`): [`Namespace`, [`VersionMap`](classes/VersionMap.md)] \| []

#### Parameters

| Name | Type |
| :------ | :------ |
| `p` | `Program` |
| `t` | `Type` |

#### Returns

[`Namespace`, [`VersionMap`](classes/VersionMap.md)] \| []

___

### getVersionsForEnum

▸ **getVersionsForEnum**(`program`, `en`): [`Namespace`, [`VersionMap`](classes/VersionMap.md)] \| []

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `en` | `Enum` |

#### Returns

[`Namespace`, [`VersionMap`](classes/VersionMap.md)] \| []

___

### hasDifferentNameAtVersion

▸ **hasDifferentNameAtVersion**(`p`, `type`, `version`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `p` | `Program` |
| `type` | `Type` |
| `version` | `ObjectType` |

#### Returns

`boolean`

___

### hasDifferentReturnTypeAtVersion

▸ **hasDifferentReturnTypeAtVersion**(`p`, `type`, `version`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `p` | `Program` |
| `type` | `Type` |
| `version` | `ObjectType` |

#### Returns

`boolean`

___

### hasDifferentTypeAtVersion

▸ **hasDifferentTypeAtVersion**(`p`, `type`, `version`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `p` | `Program` |
| `type` | `Type` |
| `version` | `ObjectType` |

#### Returns

`boolean`

___

### indexTimeline

▸ **indexTimeline**(`program`, `timeline`, `projectingMoment`): `ObjectType` & `TypePrototype`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `timeline` | `VersioningTimeline` |
| `projectingMoment` | `TimelineMoment` |

#### Returns

`ObjectType` & `TypePrototype`

___

### madeOptionalAfter

▸ **madeOptionalAfter**(`program`, `type`, `versionKey`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `program` | `Program` |
| `type` | `Type` |
| `versionKey` | `ObjectType` |

#### Returns

`boolean`

___

### resolveVersions

▸ **resolveVersions**(`program`, `rootNs`): [`VersionResolution`](interfaces/VersionResolution.md)[]

Resolve the version to use for all namespace for each of the root namespace versions.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` |  |
| `rootNs` | `Namespace` | Root namespace. |

#### Returns

[`VersionResolution`](interfaces/VersionResolution.md)[]
