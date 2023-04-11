[JS Api](../index.md) / ProjectionMemberExpressionNode

# Interface: ProjectionMemberExpressionNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

  ↳ **`ProjectionMemberExpressionNode`**

## Table of contents

### Properties

- [base](ProjectionMemberExpressionNode.md#base)
- [directives](ProjectionMemberExpressionNode.md#directives)
- [docs](ProjectionMemberExpressionNode.md#docs)
- [end](ProjectionMemberExpressionNode.md#end)
- [flags](ProjectionMemberExpressionNode.md#flags)
- [id](ProjectionMemberExpressionNode.md#id)
- [kind](ProjectionMemberExpressionNode.md#kind)
- [parent](ProjectionMemberExpressionNode.md#parent)
- [pos](ProjectionMemberExpressionNode.md#pos)
- [selector](ProjectionMemberExpressionNode.md#selector)
- [symbol](ProjectionMemberExpressionNode.md#symbol)

## Properties

### base

• `Readonly` **base**: [`ProjectionExpression`](../index.md#projectionexpression)

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

### id

• `Readonly` **id**: [`IdentifierNode`](IdentifierNode.md)

___

### kind

• `Readonly` **kind**: [`ProjectionMemberExpression`](../enums/SyntaxKind.md#projectionmemberexpression)

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

### selector

• `Readonly` **selector**: ``"."`` \| ``"::"``

___

### symbol

• `Readonly` **symbol**: [`Sym`](Sym.md)

Could be undefined but making this optional creates a lot of noise. In practice,
you will likely only access symbol in cases where you know the node has a symbol.

#### Inherited from

[BaseNode](BaseNode.md).[symbol](BaseNode.md#symbol)
