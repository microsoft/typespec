[JS Api](../index.md) / LineComment

# Interface: LineComment

## Hierarchy

- [`TextRange`](TextRange.md)

  ↳ **`LineComment`**

## Table of contents

### Properties

- [end](LineComment.md#end)
- [kind](LineComment.md#kind)
- [pos](LineComment.md#pos)

## Properties

### end

• `Readonly` **end**: `number`

The ending position measured in UTF-16 code units from the start of the
full string. Exclusive.

#### Inherited from

[TextRange](TextRange.md).[end](TextRange.md#end)

___

### kind

• `Readonly` **kind**: [`LineComment`](../enums/SyntaxKind.md#linecomment)

___

### pos

• `Readonly` **pos**: `number`

The starting position of the ranger measured in UTF-16 code units from the
start of the full string. Inclusive.

#### Inherited from

[TextRange](TextRange.md).[pos](TextRange.md#pos)
