---
jsApi: true
title: "[I] SourceFile"

---
## Extended By

- [`ServerSourceFile`](ServerSourceFile.md)

## Properties

| Modifier | Property | Type | Description |
| :------ | :------ | :------ | :------ |
| `readonly` | `path` | `string` | The source file path.<br /><br />This is used only for diagnostics. The command line compiler will populate<br />it with the actual path from which the file was read, but it can actually<br />be an arbitrary name for other scenarios. |
| `readonly` | `text` | `string` | The source code text. |

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

***

### getLineStarts()

```ts
getLineStarts(): readonly number[]
```

Array of positions in the text where each line begins. There is one entry
per line, in order of lines, and each entry represents the offset in UTF-16
code units from the start of the document to the beginning of the line.
