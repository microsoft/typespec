[JS Api](../index.md) / BlockComment

# Interface: BlockComment

## Hierarchy

- [`TextRange`](TextRange.md)

  ↳ **`BlockComment`**

## Table of contents

### Properties

- [end](BlockComment.md#end)
- [kind](BlockComment.md#kind)
- [parsedAsDocs](BlockComment.md#parsedasdocs)
- [pos](BlockComment.md#pos)

## Properties

### end

• `Readonly` **end**: `number`

The ending position measured in UTF-16 code units from the start of the
full string. Exclusive.

#### Inherited from

[TextRange](TextRange.md).[end](TextRange.md#end)

___

### kind

• `Readonly` **kind**: [`BlockComment`](../enums/SyntaxKind.md#blockcomment)

___

### parsedAsDocs

• `Optional` `Readonly` **parsedAsDocs**: `boolean`

If that comment was parsed as a doc comment. If parserOptions.docs=false this will always be false.

___

### pos

• `Readonly` **pos**: `number`

The starting position of the ranger measured in UTF-16 code units from the
start of the full string. Inclusive.

#### Inherited from

[TextRange](TextRange.md).[pos](TextRange.md#pos)
