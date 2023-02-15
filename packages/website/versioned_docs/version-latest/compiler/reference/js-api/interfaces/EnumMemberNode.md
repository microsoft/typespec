[JS Api](../index.md) / EnumMemberNode

# Interface: EnumMemberNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

  ↳ **`EnumMemberNode`**

## Table of contents

### Properties

- [decorators](EnumMemberNode.md#decorators)
- [directives](EnumMemberNode.md#directives)
- [docs](EnumMemberNode.md#docs)
- [end](EnumMemberNode.md#end)
- [flags](EnumMemberNode.md#flags)
- [id](EnumMemberNode.md#id)
- [kind](EnumMemberNode.md#kind)
- [parent](EnumMemberNode.md#parent)
- [pos](EnumMemberNode.md#pos)
- [symbol](EnumMemberNode.md#symbol)
- [value](EnumMemberNode.md#value)

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

• `Readonly` **kind**: [`EnumMember`](../enums/SyntaxKind.md#enummember)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

___

### parent

• `Optional` `Readonly` **parent**: [`EnumStatementNode`](EnumStatementNode.md)

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

• `Optional` `Readonly` **value**: [`StringLiteralNode`](StringLiteralNode.md) \| [`NumericLiteralNode`](NumericLiteralNode.md)
