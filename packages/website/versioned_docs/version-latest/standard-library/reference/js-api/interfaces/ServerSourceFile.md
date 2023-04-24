[JS Api](../index.md) / ServerSourceFile

# Interface: ServerSourceFile

## Hierarchy

- [`SourceFile`](SourceFile.md)

  ↳ **`ServerSourceFile`**

## Table of contents

### Properties

- [document](ServerSourceFile.md#document)
- [path](ServerSourceFile.md#path)
- [text](ServerSourceFile.md#text)

### Methods

- [getLineAndCharacterOfPosition](ServerSourceFile.md#getlineandcharacterofposition)
- [getLineStarts](ServerSourceFile.md#getlinestarts)

## Properties

### document

• `Optional` `Readonly` **document**: `TextDocument`

___

### path

• `Readonly` **path**: `string`

The source file path.

This is used only for diagnostics. The command line compiler will populate
it with the actual path from which the file was read, but it can actually
be an arbitrary name for other scenarios.

#### Inherited from

[SourceFile](SourceFile.md).[path](SourceFile.md#path)

___

### text

• `Readonly` **text**: `string`

The source code text.

#### Inherited from

[SourceFile](SourceFile.md).[text](SourceFile.md#text)

## Methods

### getLineAndCharacterOfPosition

▸ **getLineAndCharacterOfPosition**(`position`): [`LineAndCharacter`](LineAndCharacter.md)

Converts a one-dimensional position in the document (measured in UTF-16
code units) to line number and offset from line start.

#### Parameters

| Name | Type |
| :------ | :------ |
| `position` | `number` |

#### Returns

[`LineAndCharacter`](LineAndCharacter.md)

#### Inherited from

[SourceFile](SourceFile.md).[getLineAndCharacterOfPosition](SourceFile.md#getlineandcharacterofposition)

___

### getLineStarts

▸ **getLineStarts**(): readonly `number`[]

Array of positions in the text where each line begins. There is one entry
per line, in order of lines, and each entry represents the offset in UTF-16
code units from the start of the document to the beginning of the line.

#### Returns

readonly `number`[]

#### Inherited from

[SourceFile](SourceFile.md).[getLineStarts](SourceFile.md#getlinestarts)
