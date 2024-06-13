---
jsApi: true
title: "[I] SourceFile"

---
## Extended by

- [`ServerSourceFile`](ServerSourceFile.md)

## Properties

| Property | Modifier | Type | Description |
| :------ | :------ | :------ | :------ |
| `path` | `readonly` | `string` | <p>The source file path.</p><p>This is used only for diagnostics. The command line compiler will populate it with the actual path from which the file was read, but it can actually be an arbitrary name for other scenarios.</p> |
| `text` | `readonly` | `string` | The source code text. |

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
