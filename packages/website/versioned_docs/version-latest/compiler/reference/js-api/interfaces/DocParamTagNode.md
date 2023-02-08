[JS Api](../index.md) / DocParamTagNode

# Interface: DocParamTagNode

## Hierarchy

- [`DocTagBaseNode`](DocTagBaseNode.md)

  ↳ **`DocParamTagNode`**

## Table of contents

### Properties

- [content](DocParamTagNode.md#content)
- [directives](DocParamTagNode.md#directives)
- [docs](DocParamTagNode.md#docs)
- [end](DocParamTagNode.md#end)
- [flags](DocParamTagNode.md#flags)
- [kind](DocParamTagNode.md#kind)
- [paramName](DocParamTagNode.md#paramname)
- [parent](DocParamTagNode.md#parent)
- [pos](DocParamTagNode.md#pos)
- [symbol](DocParamTagNode.md#symbol)
- [tagName](DocParamTagNode.md#tagname)

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

• `Readonly` **kind**: [`DocParamTag`](../enums/SyntaxKind.md#docparamtag)

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
