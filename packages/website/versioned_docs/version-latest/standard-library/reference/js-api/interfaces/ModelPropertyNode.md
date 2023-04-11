[JS Api](../index.md) / ModelPropertyNode

# Interface: ModelPropertyNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

  ↳ **`ModelPropertyNode`**

## Table of contents

### Properties

- [decorators](ModelPropertyNode.md#decorators)
- [default](ModelPropertyNode.md#default)
- [directives](ModelPropertyNode.md#directives)
- [docs](ModelPropertyNode.md#docs)
- [end](ModelPropertyNode.md#end)
- [flags](ModelPropertyNode.md#flags)
- [id](ModelPropertyNode.md#id)
- [kind](ModelPropertyNode.md#kind)
- [optional](ModelPropertyNode.md#optional)
- [parent](ModelPropertyNode.md#parent)
- [pos](ModelPropertyNode.md#pos)
- [symbol](ModelPropertyNode.md#symbol)
- [value](ModelPropertyNode.md#value)

## Properties

### decorators

• `Readonly` **decorators**: readonly [`DecoratorExpressionNode`](DecoratorExpressionNode.md)[]

___

### default

• `Optional` `Readonly` **default**: [`Expression`](../index.md#expression)

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

• `Readonly` **kind**: [`ModelProperty`](../enums/SyntaxKind.md#modelproperty)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

___

### optional

• `Readonly` **optional**: `boolean`

___

### parent

• `Optional` `Readonly` **parent**: [`ModelStatementNode`](ModelStatementNode.md) \| [`ModelExpressionNode`](ModelExpressionNode.md)

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
