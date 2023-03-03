[JS Api](../index.md) / MetadataInfoOptions

# Interface: MetadataInfoOptions

## Table of contents

### Methods

- [canShareProperty](MetadataInfoOptions.md#canshareproperty)

## Methods

### canShareProperty

▸ `Optional` **canShareProperty**(`property`): `boolean`

Optional callback to indicate that a property can be shared with
`Visibility.All` representation even for visibilities where it is not
visible.

This is used, for example, in OpenAPI emit where a property can be
marked `readOnly: true` to represent @visibility("read") without
creating a separate schema schema for Visibility.Read.

#### Parameters

| Name | Type |
| :------ | :------ |
| `property` | `ModelProperty` |

#### Returns

`boolean`
