[JS Api](../index.md) / InterfaceStatementNode

# Interface: InterfaceStatementNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

- [`DeclarationNode`](DeclarationNode.md)

- [`TemplateDeclarationNode`](TemplateDeclarationNode.md)

  ↳ **`InterfaceStatementNode`**

## Table of contents

### Properties

- [decorators](InterfaceStatementNode.md#decorators)
- [directives](InterfaceStatementNode.md#directives)
- [docs](InterfaceStatementNode.md#docs)
- [end](InterfaceStatementNode.md#end)
- [extends](InterfaceStatementNode.md#extends)
- [flags](InterfaceStatementNode.md#flags)
- [id](InterfaceStatementNode.md#id)
- [kind](InterfaceStatementNode.md#kind)
- [locals](InterfaceStatementNode.md#locals)
- [operations](InterfaceStatementNode.md#operations)
- [parent](InterfaceStatementNode.md#parent)
- [pos](InterfaceStatementNode.md#pos)
- [symbol](InterfaceStatementNode.md#symbol)
- [templateParameters](InterfaceStatementNode.md#templateparameters)

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

### extends

• `Readonly` **extends**: readonly [`TypeReferenceNode`](TypeReferenceNode.md)[]

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

• `Readonly` **kind**: [`InterfaceStatement`](../enums/SyntaxKind.md#interfacestatement)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

___

### locals

• `Optional` `Readonly` **locals**: [`SymbolTable`](SymbolTable.md)

#### Inherited from

[TemplateDeclarationNode](TemplateDeclarationNode.md).[locals](TemplateDeclarationNode.md#locals)

___

### operations

• `Readonly` **operations**: readonly [`OperationStatementNode`](OperationStatementNode.md)[]

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
