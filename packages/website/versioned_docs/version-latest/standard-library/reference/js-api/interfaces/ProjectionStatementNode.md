[JS Api](../index.md) / ProjectionStatementNode

# Interface: ProjectionStatementNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

- [`DeclarationNode`](DeclarationNode.md)

  ↳ **`ProjectionStatementNode`**

## Table of contents

### Properties

- [directives](ProjectionStatementNode.md#directives)
- [docs](ProjectionStatementNode.md#docs)
- [end](ProjectionStatementNode.md#end)
- [flags](ProjectionStatementNode.md#flags)
- [from](ProjectionStatementNode.md#from)
- [id](ProjectionStatementNode.md#id)
- [kind](ProjectionStatementNode.md#kind)
- [parent](ProjectionStatementNode.md#parent)
- [pos](ProjectionStatementNode.md#pos)
- [preFrom](ProjectionStatementNode.md#prefrom)
- [preTo](ProjectionStatementNode.md#preto)
- [projections](ProjectionStatementNode.md#projections)
- [selector](ProjectionStatementNode.md#selector)
- [symbol](ProjectionStatementNode.md#symbol)
- [to](ProjectionStatementNode.md#to)

## Properties

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

### from

• `Optional` `Readonly` **from**: [`ProjectionNode`](ProjectionNode.md)

___

### id

• `Readonly` **id**: [`IdentifierNode`](IdentifierNode.md)

#### Inherited from

[DeclarationNode](DeclarationNode.md).[id](DeclarationNode.md#id)

___

### kind

• `Readonly` **kind**: [`ProjectionStatement`](../enums/SyntaxKind.md#projectionstatement)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

___

### parent

• `Optional` `Readonly` **parent**: [`TypeSpecScriptNode`](TypeSpecScriptNode.md) \| [`NamespaceStatementNode`](NamespaceStatementNode.md)

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

### preFrom

• `Optional` `Readonly` **preFrom**: [`ProjectionNode`](ProjectionNode.md)

___

### preTo

• `Optional` `Readonly` **preTo**: [`ProjectionNode`](ProjectionNode.md)

___

### projections

• `Readonly` **projections**: readonly [`ProjectionNode`](ProjectionNode.md)[]

___

### selector

• `Readonly` **selector**: [`MemberExpressionNode`](MemberExpressionNode.md) \| [`IdentifierNode`](IdentifierNode.md) \| [`ProjectionModelSelectorNode`](ProjectionModelSelectorNode.md) \| [`ProjectionModelPropertySelectorNode`](ProjectionModelPropertySelectorNode.md) \| [`ProjectionInterfaceSelectorNode`](ProjectionInterfaceSelectorNode.md) \| [`ProjectionOperationSelectorNode`](ProjectionOperationSelectorNode.md) \| [`ProjectionEnumSelectorNode`](ProjectionEnumSelectorNode.md) \| [`ProjectionEnumMemberSelectorNode`](ProjectionEnumMemberSelectorNode.md) \| [`ProjectionUnionSelectorNode`](ProjectionUnionSelectorNode.md) \| [`ProjectionUnionVariantSelectorNode`](ProjectionUnionVariantSelectorNode.md)

___

### symbol

• `Readonly` **symbol**: [`Sym`](Sym.md)

Could be undefined but making this optional creates a lot of noise. In practice,
you will likely only access symbol in cases where you know the node has a symbol.

#### Inherited from

[BaseNode](BaseNode.md).[symbol](BaseNode.md#symbol)

___

### to

• `Optional` `Readonly` **to**: [`ProjectionNode`](ProjectionNode.md)
