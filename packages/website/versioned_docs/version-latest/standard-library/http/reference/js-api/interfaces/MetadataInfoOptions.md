[JS Api](../index.md) / MetadataInfoOptions

# Interface: MetadataInfoOptions

## Table of contents

### Properties

- [canonicalVisibility](MetadataInfoOptions.md#canonicalvisibility)

### Methods

- [canShareProperty](MetadataInfoOptions.md#canshareproperty)

## Properties

### canonicalVisibility

• `Optional` **canonicalVisibility**: [`Visibility`](../enums/Visibility.md)

The visibility to be used as the baseline against which
[isEmptied](MetadataInfo.md#isemptied) and [isTransformed](MetadataInfo.md#istransformed)
are computed. If not specified, [None](../enums/Visibility.md#none) is used, which
will consider that any model that has fields that are only visible to
some visibilities as transformed.

## Methods

### canShareProperty

▸ `Optional` **canShareProperty**(`property`): `boolean`

Optional callback to indicate that a property can be shared with the
canonical representation even for visibilities where it is not visible.

This is used, for example, in OpenAPI emit where a property can be
marked `readOnly: true` to represent @visibility("read") without
creating a separate schema schema for [Read](../enums/Visibility.md#read).

#### Parameters

| Name | Type |
| :------ | :------ |
| `property` | `ModelProperty` |

#### Returns

`boolean`
