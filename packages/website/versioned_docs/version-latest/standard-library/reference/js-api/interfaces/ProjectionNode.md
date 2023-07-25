[JS Api](../index.md) / ProjectionNode

# Interface: ProjectionNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

  ↳ **`ProjectionNode`**

## Table of contents

### Properties

- [body](ProjectionNode.md#body)
- [direction](ProjectionNode.md#direction)
- [directionId](ProjectionNode.md#directionid)
- [directives](ProjectionNode.md#directives)
- [docs](ProjectionNode.md#docs)
- [end](ProjectionNode.md#end)
- [flags](ProjectionNode.md#flags)
- [kind](ProjectionNode.md#kind)
- [locals](ProjectionNode.md#locals)
- [modifierIds](ProjectionNode.md#modifierids)
- [parameters](ProjectionNode.md#parameters)
- [parent](ProjectionNode.md#parent)
- [pos](ProjectionNode.md#pos)
- [symbol](ProjectionNode.md#symbol)

## Properties

### body

• `Readonly` **body**: readonly [`ProjectionExpressionStatementNode`](ProjectionExpressionStatementNode.md)[]

___

### direction

• `Readonly` **direction**: ``"to"`` \| ``"from"`` \| ``"pre_to"`` \| ``"pre_from"`` \| ``"<error>"``

___

### directionId

• `Readonly` **directionId**: [`IdentifierNode`](IdentifierNode.md)

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

• `Readonly` **kind**: [`Projection`](../enums/SyntaxKind.md#projection)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

___

### locals

• `Optional` `Readonly` **locals**: [`SymbolTable`](SymbolTable.md)

___

### modifierIds

• `Readonly` **modifierIds**: readonly [`IdentifierNode`](IdentifierNode.md)[]

___

### parameters

• `Readonly` **parameters**: [`ProjectionParameterDeclarationNode`](ProjectionParameterDeclarationNode.md)[]

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
