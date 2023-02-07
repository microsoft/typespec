[JS Api](../index.md) / UnionVariantNode

# Interface: UnionVariantNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

  ↳ **`UnionVariantNode`**

## Table of contents

### Properties

- [decorators](UnionVariantNode.md#decorators)
- [directives](UnionVariantNode.md#directives)
- [docs](UnionVariantNode.md#docs)
- [end](UnionVariantNode.md#end)
- [flags](UnionVariantNode.md#flags)
- [id](UnionVariantNode.md#id)
- [kind](UnionVariantNode.md#kind)
- [parent](UnionVariantNode.md#parent)
- [pos](UnionVariantNode.md#pos)
- [symbol](UnionVariantNode.md#symbol)
- [value](UnionVariantNode.md#value)

## Properties

### decorators

• `Readonly` **decorators**: readonly [`DecoratorExpressionNode`](DecoratorExpressionNode.md)[]

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

• `Readonly` **id**: [`IdentifierNode`](IdentifierNode.md) \| [`StringLiteralNode`](StringLiteralNode.md)

___

### kind

• `Readonly` **kind**: [`UnionVariant`](../enums/SyntaxKind.md#unionvariant)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

___

### parent

• `Optional` `Readonly` **parent**: [`UnionStatementNode`](UnionStatementNode.md)

#### Overrides

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

### value

• `Readonly` **value**: [`Expression`](../index.md#expression)
