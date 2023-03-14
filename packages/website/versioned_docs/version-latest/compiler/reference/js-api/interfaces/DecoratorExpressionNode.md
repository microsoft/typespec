[JS Api](../index.md) / DecoratorExpressionNode

# Interface: DecoratorExpressionNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

  ↳ **`DecoratorExpressionNode`**

## Table of contents

### Properties

- [arguments](DecoratorExpressionNode.md#arguments)
- [directives](DecoratorExpressionNode.md#directives)
- [docs](DecoratorExpressionNode.md#docs)
- [end](DecoratorExpressionNode.md#end)
- [flags](DecoratorExpressionNode.md#flags)
- [kind](DecoratorExpressionNode.md#kind)
- [parent](DecoratorExpressionNode.md#parent)
- [pos](DecoratorExpressionNode.md#pos)
- [symbol](DecoratorExpressionNode.md#symbol)
- [target](DecoratorExpressionNode.md#target)

## Properties

### arguments

• `Readonly` **arguments**: readonly [`Expression`](../index.md#expression)[]

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

• `Readonly` **kind**: [`DecoratorExpression`](../enums/SyntaxKind.md#decoratorexpression)

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

### target

• `Readonly` **target**: [`MemberExpressionNode`](MemberExpressionNode.md) \| [`IdentifierNode`](IdentifierNode.md)
