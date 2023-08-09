[JS Api](../index.md) / ModuleLibraryMetadata

# Interface: ModuleLibraryMetadata

Data for a library. Either loaded via a node_modules package or a standalone js file

## Hierarchy

- `LibraryMetadataBase`

  ↳ **`ModuleLibraryMetadata`**

## Table of contents

### Properties

- [bugs](ModuleLibraryMetadata.md#bugs)
- [homepage](ModuleLibraryMetadata.md#homepage)
- [name](ModuleLibraryMetadata.md#name)
- [type](ModuleLibraryMetadata.md#type)

## Properties

### bugs

• `Optional` **bugs**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `url?` | `string` | Url where to file bugs for this library. |

#### Inherited from

LibraryMetadataBase.bugs

___

### homepage

• `Optional` **homepage**: `string`

Library homepage.

#### Inherited from

LibraryMetadataBase.homepage

___

### name

• **name**: `string`

Library name as specified in the package.json or in exported $lib.

___

### type

• **type**: ``"module"``
