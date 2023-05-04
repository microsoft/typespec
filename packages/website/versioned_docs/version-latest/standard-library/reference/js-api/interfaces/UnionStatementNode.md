[JS Api](../index.md) / UnionStatementNode

# Interface: UnionStatementNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

- [`DeclarationNode`](DeclarationNode.md)

- [`TemplateDeclarationNode`](TemplateDeclarationNode.md)

  ↳ **`UnionStatementNode`**

## Table of contents

### Properties

- [decorators](UnionStatementNode.md#decorators)
- [directives](UnionStatementNode.md#directives)
- [docs](UnionStatementNode.md#docs)
- [end](UnionStatementNode.md#end)
- [flags](UnionStatementNode.md#flags)
- [id](UnionStatementNode.md#id)
- [kind](UnionStatementNode.md#kind)
- [locals](UnionStatementNode.md#locals)
- [options](UnionStatementNode.md#options)
- [parent](UnionStatementNode.md#parent)
- [pos](UnionStatementNode.md#pos)
- [symbol](UnionStatementNode.md#symbol)
- [templateParameters](UnionStatementNode.md#templateparameters)

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

• `Readonly` **kind**: [`UnionStatement`](../enums/SyntaxKind.md#unionstatement)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

___

### locals

• `Optional` `Readonly` **locals**: [`SymbolTable`](SymbolTable.md)

#### Inherited from

[TemplateDeclarationNode](TemplateDeclarationNode.md).[locals](TemplateDeclarationNode.md#locals)

___

### options

• `Readonly` **options**: readonly [`UnionVariantNode`](UnionVariantNode.md)[]

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

### symbol

• `Readonly` **symbol**: [`Sym`](Sym.md)

Could be undefined but making this optional creates a lot of noise. In practice,
you will likely only access symbol in cases where you know the node has a symbol.

#### Inherited from

[BaseNode](BaseNode.md).[symbol](BaseNode.md#symbol)

___

### templateParameters

• `Readonly` **templateParameters**: readonly [`TemplateParameterDeclarationNode`](TemplateParameterDeclarationNode.md)[]

#### Inherited from

[TemplateDeclarationNode](TemplateDeclarationNode.md).[templateParameters](TemplateDeclarationNode.md#templateparameters)
