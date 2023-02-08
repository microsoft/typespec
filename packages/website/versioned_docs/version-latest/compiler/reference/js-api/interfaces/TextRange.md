[JS Api](../index.md) / TextRange

# Interface: TextRange

## Hierarchy

- **`TextRange`**

  ↳ [`BaseNode`](BaseNode.md)

  ↳ [`LineComment`](LineComment.md)

  ↳ [`BlockComment`](BlockComment.md)

  ↳ [`SourceLocation`](SourceLocation.md)

## Table of contents

### Properties

- [end](TextRange.md#end)
- [pos](TextRange.md#pos)

## Properties

### end

• `Readonly` **end**: `number`

The ending position measured in UTF-16 code units from the start of the
full string. Exclusive.

___

### pos

• `Readonly` **pos**: `number`

The starting position of the ranger measured in UTF-16 code units from the
start of the full string. Inclusive.
