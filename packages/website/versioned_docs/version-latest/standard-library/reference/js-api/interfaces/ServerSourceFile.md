---
jsApi: true
title: "[I] ServerSourceFile"

---
## Extends

- [`SourceFile`](SourceFile.md)

## Properties

| Property | Modifier | Type | Description | Inherited from |
| :------ | :------ | :------ | :------ | :------ |
| `document?` | `readonly` | `TextDocument` | - | - |
| `path` | `readonly` | `string` | <p>The source file path.</p><p>This is used only for diagnostics. The command line compiler will populate it with the actual path from which the file was read, but it can actually be an arbitrary name for other scenarios.</p> | [`SourceFile`](SourceFile.md).`path` |
| `text` | `readonly` | `string` | The source code text. | [`SourceFile`](SourceFile.md).`text` |

## Methods

### getLineAndCharacterOfPosition()

```ts
getLineAndCharacterOfPosition(position): LineAndCharacter
```

Converts a one-dimensional position in the document (measured in UTF-16
code units) to line number and offset from line start.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `position` | `number` |

#### Returns

[`LineAndCharacter`](LineAndCharacter.md)

#### Inherited from

[`SourceFile`](SourceFile.md).[`getLineAndCharacterOfPosition`](SourceFile.md#getlineandcharacterofposition)

***

### getLineStarts()

```ts
getLineStarts(): readonly number[]
```

Array of positions in the text where each line begins. There is one entry
per line, in order of lines, and each entry represents the offset in UTF-16
code units from the start of the document to the beginning of the line.

#### Returns

readonly `number`[]

#### Inherited from

[`SourceFile`](SourceFile.md).[`getLineStarts`](SourceFile.md#getlinestarts)
