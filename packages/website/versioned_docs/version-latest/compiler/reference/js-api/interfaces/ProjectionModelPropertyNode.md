[JS Api](../index.md) / ProjectionModelPropertyNode

# Interface: ProjectionModelPropertyNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

  ↳ **`ProjectionModelPropertyNode`**

## Table of contents

### Properties

- [decorators](ProjectionModelPropertyNode.md#decorators)
- [default](ProjectionModelPropertyNode.md#default)
- [directives](ProjectionModelPropertyNode.md#directives)
- [docs](ProjectionModelPropertyNode.md#docs)
- [end](ProjectionModelPropertyNode.md#end)
- [flags](ProjectionModelPropertyNode.md#flags)
- [id](ProjectionModelPropertyNode.md#id)
- [kind](ProjectionModelPropertyNode.md#kind)
- [optional](ProjectionModelPropertyNode.md#optional)
- [parent](ProjectionModelPropertyNode.md#parent)
- [pos](ProjectionModelPropertyNode.md#pos)
- [symbol](ProjectionModelPropertyNode.md#symbol)
- [value](ProjectionModelPropertyNode.md#value)

## Properties

### decorators

• `Readonly` **decorators**: readonly [`DecoratorExpressionNode`](DecoratorExpressionNode.md)[]

___

### default

• `Optional` `Readonly` **default**: [`ProjectionExpression`](../index.md#projectionexpression)

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

• `Readonly` **kind**: [`ProjectionModelProperty`](../enums/SyntaxKind.md#projectionmodelproperty)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

___

### optional

• `Readonly` **optional**: `boolean`

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

### value

• `Readonly` **value**: [`ProjectionExpression`](../index.md#projectionexpression)
