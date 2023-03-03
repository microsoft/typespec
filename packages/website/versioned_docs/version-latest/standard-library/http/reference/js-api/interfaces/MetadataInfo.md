[JS Api](../index.md) / MetadataInfo

# Interface: MetadataInfo

Provides information about changes that happen to a data type's payload
when inapplicable metadata is added or invisible properties are removed.

Results are computed on demand and expensive computations are memoized.

## Table of contents

### Methods

- [getEffectivePayloadType](MetadataInfo.md#geteffectivepayloadtype)
- [isEmptied](MetadataInfo.md#isemptied)
- [isOptional](MetadataInfo.md#isoptional)
- [isPayloadProperty](MetadataInfo.md#ispayloadproperty)
- [isTransformed](MetadataInfo.md#istransformed)

## Methods

### getEffectivePayloadType

▸ **getEffectivePayloadType**(`type`, `visibility`): `Type`

If type is an anonymous model, tries to find a named model that has the
same set of properties when non-payload properties are excluded.

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `Type` |
| `visibility` | [`Visibility`](../enums/Visibility.md) |

#### Returns

`Type`

___

### isEmptied

▸ **isEmptied**(`type`, `visibility`): `boolean`

Determines if the given type is a model that becomes empty once
applicable metadata is removed and visibility is applied.

Note that a model is not considered emptied if it was already empty in
the first place, or has a base model or indexer.

When the type of a property is emptied by visibility, the property
itself is also removed.

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `undefined` \| `Type` |
| `visibility` | [`Visibility`](../enums/Visibility.md) |

#### Returns

`boolean`

___

### isOptional

▸ **isOptional**(`property`, `visibility`): `boolean`

Determines if the given property is optional in the request or
response payload for the given visibility.

#### Parameters

| Name | Type |
| :------ | :------ |
| `property` | `ModelProperty` |
| `visibility` | [`Visibility`](../enums/Visibility.md) |

#### Returns

`boolean`

___

### isPayloadProperty

▸ **isPayloadProperty**(`property`, `visibility`): `boolean`

Determines if the given property is part of the request or response
payload and not applicable metadata (@see isApplicableMetadata) or
filtered out by the given visibility.

#### Parameters

| Name | Type |
| :------ | :------ |
| `property` | `ModelProperty` |
| `visibility` | [`Visibility`](../enums/Visibility.md) |

#### Returns

`boolean`

___

### isTransformed

▸ **isTransformed**(`type`, `visibility`): `boolean`

Determines if the given type is transformed by applying the given
visibility and removing invisible properties or adding inapplicable
metadata properties.

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | `undefined` \| `Type` |
| `visibility` | [`Visibility`](../enums/Visibility.md) |

#### Returns

`boolean`
