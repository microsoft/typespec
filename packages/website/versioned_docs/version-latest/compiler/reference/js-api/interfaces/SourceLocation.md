[JS Api](../index.md) / SourceLocation

# Interface: SourceLocation

## Hierarchy

- [`TextRange`](TextRange.md)

  ↳ **`SourceLocation`**

## Table of contents

### Properties

- [end](SourceLocation.md#end)
- [file](SourceLocation.md#file)
- [isSynthetic](SourceLocation.md#issynthetic)
- [pos](SourceLocation.md#pos)

## Properties

### end

• `Readonly` **end**: `number`

The ending position measured in UTF-16 code units from the start of the
full string. Exclusive.

#### Inherited from

[TextRange](TextRange.md).[end](TextRange.md#end)

___

### file

• **file**: [`SourceFile`](SourceFile.md)

___

### isSynthetic

• `Optional` **isSynthetic**: `boolean`

___

### pos

• `Readonly` **pos**: `number`

The starting position of the ranger measured in UTF-16 code units from the
start of the full string. Inclusive.

#### Inherited from

[TextRange](TextRange.md).[pos](TextRange.md#pos)
