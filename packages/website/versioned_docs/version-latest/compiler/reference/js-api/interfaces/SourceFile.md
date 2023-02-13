[JS Api](../index.md) / SourceFile

# Interface: SourceFile

## Hierarchy

- **`SourceFile`**

  ↳ [`ServerSourceFile`](ServerSourceFile.md)

## Table of contents

### Properties

- [path](SourceFile.md#path)
- [text](SourceFile.md#text)

### Methods

- [getLineAndCharacterOfPosition](SourceFile.md#getlineandcharacterofposition)
- [getLineStarts](SourceFile.md#getlinestarts)

## Properties

### path

• `Readonly` **path**: `string`

The source file path.

This is used only for diagnostics. The command line compiler will populate
it with the actual path from which the file was read, but it can actually
be an arbitrary name for other scenarios.

___

### text

• `Readonly` **text**: `string`

The source code text.

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

___

### getLineStarts

▸ **getLineStarts**(): readonly `number`[]

Array of positions in the text where each line begins. There is one entry
per line, in order of lines, and each entry represents the offset in UTF-16
code units from the start of the document to the beginning of the line.

#### Returns

readonly `number`[]
