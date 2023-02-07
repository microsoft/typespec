[JS Api](../index.md) / DocTemplateTagNode

# Interface: DocTemplateTagNode

## Hierarchy

- [`DocTagBaseNode`](DocTagBaseNode.md)

  ↳ **`DocTemplateTagNode`**

## Table of contents

### Properties

- [content](DocTemplateTagNode.md#content)
- [directives](DocTemplateTagNode.md#directives)
- [docs](DocTemplateTagNode.md#docs)
- [end](DocTemplateTagNode.md#end)
- [flags](DocTemplateTagNode.md#flags)
- [kind](DocTemplateTagNode.md#kind)
- [paramName](DocTemplateTagNode.md#paramname)
- [parent](DocTemplateTagNode.md#parent)
- [pos](DocTemplateTagNode.md#pos)
- [symbol](DocTemplateTagNode.md#symbol)
- [tagName](DocTemplateTagNode.md#tagname)

## Properties

### content

• `Readonly` **content**: readonly [`DocTextNode`](DocTextNode.md)[]

#### Inherited from

[DocTagBaseNode](DocTagBaseNode.md).[content](DocTagBaseNode.md#content)

___

### directives

• `Optional` `Readonly` **directives**: readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[]

#### Inherited from

[DocTagBaseNode](DocTagBaseNode.md).[directives](DocTagBaseNode.md#directives)

___

### docs

• `Optional` `Readonly` **docs**: readonly [`DocNode`](DocNode.md)[]

#### Inherited from

[DocTagBaseNode](DocTagBaseNode.md).[docs](DocTagBaseNode.md#docs)

___

### end

• `Readonly` **end**: `number`

The ending position measured in UTF-16 code units from the start of the
full string. Exclusive.

#### Inherited from

[DocTagBaseNode](DocTagBaseNode.md).[end](DocTagBaseNode.md#end)

___

### flags

• `Readonly` **flags**: [`NodeFlags`](../enums/NodeFlags.md)

#### Inherited from

[DocTagBaseNode](DocTagBaseNode.md).[flags](DocTagBaseNode.md#flags)

___

### kind

• `Readonly` **kind**: [`DocTemplateTag`](../enums/SyntaxKind.md#doctemplatetag)

#### Overrides

[DocTagBaseNode](DocTagBaseNode.md).[kind](DocTagBaseNode.md#kind)

___

### paramName

• `Readonly` **paramName**: [`IdentifierNode`](IdentifierNode.md)

___

### parent

• `Optional` `Readonly` **parent**: [`Node`](../index.md#node)

#### Inherited from

[DocTagBaseNode](DocTagBaseNode.md).[parent](DocTagBaseNode.md#parent)

___

### pos

• `Readonly` **pos**: `number`

The starting position of the ranger measured in UTF-16 code units from the
start of the full string. Inclusive.

#### Inherited from

[DocTagBaseNode](DocTagBaseNode.md).[pos](DocTagBaseNode.md#pos)

___

### symbol

• `Readonly` **symbol**: [`Sym`](Sym.md)

Could be undefined but making this optional creates a lot of noise. In practice,
you will likely only access symbol in cases where you know the node has a symbol.

#### Inherited from

[DocTagBaseNode](DocTagBaseNode.md).[symbol](DocTagBaseNode.md#symbol)

___

### tagName

• `Readonly` **tagName**: [`IdentifierNode`](IdentifierNode.md)

#### Inherited from

[DocTagBaseNode](DocTagBaseNode.md).[tagName](DocTagBaseNode.md#tagname)
