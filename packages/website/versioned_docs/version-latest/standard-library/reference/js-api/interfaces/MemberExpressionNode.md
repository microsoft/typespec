[JS Api](../index.md) / MemberExpressionNode

# Interface: MemberExpressionNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

  ↳ **`MemberExpressionNode`**

## Table of contents

### Properties

- [base](MemberExpressionNode.md#base)
- [directives](MemberExpressionNode.md#directives)
- [docs](MemberExpressionNode.md#docs)
- [end](MemberExpressionNode.md#end)
- [flags](MemberExpressionNode.md#flags)
- [id](MemberExpressionNode.md#id)
- [kind](MemberExpressionNode.md#kind)
- [parent](MemberExpressionNode.md#parent)
- [pos](MemberExpressionNode.md#pos)
- [selector](MemberExpressionNode.md#selector)
- [symbol](MemberExpressionNode.md#symbol)

## Properties

### base

• `Readonly` **base**: [`MemberExpressionNode`](MemberExpressionNode.md) \| [`IdentifierNode`](IdentifierNode.md)

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

• `Readonly` **kind**: [`MemberExpression`](../enums/SyntaxKind.md#memberexpression)

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
