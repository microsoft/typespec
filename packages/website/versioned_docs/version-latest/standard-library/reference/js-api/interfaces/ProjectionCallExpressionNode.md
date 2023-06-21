[JS Api](../index.md) / ProjectionCallExpressionNode

# Interface: ProjectionCallExpressionNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

  ↳ **`ProjectionCallExpressionNode`**

## Table of contents

### Properties

- [arguments](ProjectionCallExpressionNode.md#arguments)
- [callKind](ProjectionCallExpressionNode.md#callkind)
- [directives](ProjectionCallExpressionNode.md#directives)
- [docs](ProjectionCallExpressionNode.md#docs)
- [end](ProjectionCallExpressionNode.md#end)
- [flags](ProjectionCallExpressionNode.md#flags)
- [kind](ProjectionCallExpressionNode.md#kind)
- [parent](ProjectionCallExpressionNode.md#parent)
- [pos](ProjectionCallExpressionNode.md#pos)
- [symbol](ProjectionCallExpressionNode.md#symbol)
- [target](ProjectionCallExpressionNode.md#target)

## Properties

### arguments

• `Readonly` **arguments**: [`ProjectionExpression`](../index.md#projectionexpression)[]

___

### callKind

• `Readonly` **callKind**: ``"method"`` \| ``"template"``

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

• `Readonly` **kind**: [`ProjectionCallExpression`](../enums/SyntaxKind.md#projectioncallexpression)

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

• `Readonly` **target**: [`ProjectionExpression`](../index.md#projectionexpression)
