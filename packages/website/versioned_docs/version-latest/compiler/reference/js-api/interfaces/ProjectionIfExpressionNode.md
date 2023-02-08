[JS Api](../index.md) / ProjectionIfExpressionNode

# Interface: ProjectionIfExpressionNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

  ↳ **`ProjectionIfExpressionNode`**

## Table of contents

### Properties

- [alternate](ProjectionIfExpressionNode.md#alternate)
- [consequent](ProjectionIfExpressionNode.md#consequent)
- [directives](ProjectionIfExpressionNode.md#directives)
- [docs](ProjectionIfExpressionNode.md#docs)
- [end](ProjectionIfExpressionNode.md#end)
- [flags](ProjectionIfExpressionNode.md#flags)
- [kind](ProjectionIfExpressionNode.md#kind)
- [parent](ProjectionIfExpressionNode.md#parent)
- [pos](ProjectionIfExpressionNode.md#pos)
- [symbol](ProjectionIfExpressionNode.md#symbol)
- [test](ProjectionIfExpressionNode.md#test)

## Properties

### alternate

• `Optional` `Readonly` **alternate**: [`ProjectionIfExpressionNode`](ProjectionIfExpressionNode.md) \| [`ProjectionBlockExpressionNode`](ProjectionBlockExpressionNode.md)

___

### consequent

• `Readonly` **consequent**: [`ProjectionBlockExpressionNode`](ProjectionBlockExpressionNode.md)

___

### directives

• `Optional` `Readonly` **directives**: readonly [`DirectiveExpressionNode`](DirectiveExpressionNode.md)[]

#### Inherited from

[BaseNode](BaseNode.md).[directives](BaseNode.md#directives)

___

### docs

• `Optional` `Readonly` **docs**: readonly [`DocNode`](DocNode.md)[]

#### Inherited from

[BaseNode](BaseNode.md).[docs](BaseNode.md#docs)

___

### end

• `Readonly` **end**: `number`

The ending position measured in UTF-16 code units from the start of the
full string. Exclusive.

#### Inherited from

[BaseNode](BaseNode.md).[end](BaseNode.md#end)

___

### flags

• `Readonly` **flags**: [`NodeFlags`](../enums/NodeFlags.md)

#### Inherited from

[BaseNode](BaseNode.md).[flags](BaseNode.md#flags)

___

### kind

• `Readonly` **kind**: [`ProjectionIfExpression`](../enums/SyntaxKind.md#projectionifexpression)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

___

### parent

• `Optional` `Readonly` **parent**: [`Node`](../index.md#node)

#### Inherited from

[BaseNode](BaseNode.md).[parent](BaseNode.md#parent)

___

### pos

• `Readonly` **pos**: `number`

The starting position of the ranger measured in UTF-16 code units from the
start of the full string. Inclusive.

#### Inherited from

[BaseNode](BaseNode.md).[pos](BaseNode.md#pos)

___

### symbol

• `Readonly` **symbol**: [`Sym`](Sym.md)

Could be undefined but making this optional creates a lot of noise. In practice,
you will likely only access symbol in cases where you know the node has a symbol.

#### Inherited from

[BaseNode](BaseNode.md).[symbol](BaseNode.md#symbol)

___

### test

• `Readonly` **test**: [`ProjectionExpression`](../index.md#projectionexpression)
