[JS Api](../index.md) / ProjectionLambdaExpressionNode

# Interface: ProjectionLambdaExpressionNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

  ↳ **`ProjectionLambdaExpressionNode`**

## Table of contents

### Properties

- [body](ProjectionLambdaExpressionNode.md#body)
- [directives](ProjectionLambdaExpressionNode.md#directives)
- [docs](ProjectionLambdaExpressionNode.md#docs)
- [end](ProjectionLambdaExpressionNode.md#end)
- [flags](ProjectionLambdaExpressionNode.md#flags)
- [kind](ProjectionLambdaExpressionNode.md#kind)
- [locals](ProjectionLambdaExpressionNode.md#locals)
- [parameters](ProjectionLambdaExpressionNode.md#parameters)
- [parent](ProjectionLambdaExpressionNode.md#parent)
- [pos](ProjectionLambdaExpressionNode.md#pos)
- [symbol](ProjectionLambdaExpressionNode.md#symbol)

## Properties

### body

• `Readonly` **body**: [`ProjectionBlockExpressionNode`](ProjectionBlockExpressionNode.md)

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

• `Readonly` **kind**: [`ProjectionLambdaExpression`](../enums/SyntaxKind.md#projectionlambdaexpression)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

___

### locals

• `Optional` `Readonly` **locals**: [`SymbolTable`](SymbolTable.md)

___

### parameters

• `Readonly` **parameters**: readonly [`ProjectionLambdaParameterDeclarationNode`](ProjectionLambdaParameterDeclarationNode.md)[]

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
