[JS Api](../index.md) / NamespaceStatementNode

# Interface: NamespaceStatementNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

- [`DeclarationNode`](DeclarationNode.md)

  ↳ **`NamespaceStatementNode`**

## Table of contents

### Properties

- [decorators](NamespaceStatementNode.md#decorators)
- [directives](NamespaceStatementNode.md#directives)
- [docs](NamespaceStatementNode.md#docs)
- [end](NamespaceStatementNode.md#end)
- [flags](NamespaceStatementNode.md#flags)
- [id](NamespaceStatementNode.md#id)
- [kind](NamespaceStatementNode.md#kind)
- [locals](NamespaceStatementNode.md#locals)
- [parent](NamespaceStatementNode.md#parent)
- [pos](NamespaceStatementNode.md#pos)
- [statements](NamespaceStatementNode.md#statements)
- [symbol](NamespaceStatementNode.md#symbol)

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

• `Readonly` **id**: [`IdentifierNode`](IdentifierNode.md)

#### Inherited from

[DeclarationNode](DeclarationNode.md).[id](DeclarationNode.md#id)

___

### kind

• `Readonly` **kind**: [`NamespaceStatement`](../enums/SyntaxKind.md#namespacestatement)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

___

### locals

• `Optional` `Readonly` **locals**: [`SymbolTable`](SymbolTable.md)

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

### statements

• `Optional` `Readonly` **statements**: [`NamespaceStatementNode`](NamespaceStatementNode.md) \| readonly [`Statement`](../index.md#statement)[]

___

### symbol

• `Readonly` **symbol**: [`Sym`](Sym.md)

Could be undefined but making this optional creates a lot of noise. In practice,
you will likely only access symbol in cases where you know the node has a symbol.

#### Inherited from

[BaseNode](BaseNode.md).[symbol](BaseNode.md#symbol)
