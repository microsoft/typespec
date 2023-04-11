[JS Api](../index.md) / TemplateParameterDeclarationNode

# Interface: TemplateParameterDeclarationNode

## Hierarchy

- [`DeclarationNode`](DeclarationNode.md)

- [`BaseNode`](BaseNode.md)

  ↳ **`TemplateParameterDeclarationNode`**

## Table of contents

### Properties

- [constraint](TemplateParameterDeclarationNode.md#constraint)
- [default](TemplateParameterDeclarationNode.md#default)
- [directives](TemplateParameterDeclarationNode.md#directives)
- [docs](TemplateParameterDeclarationNode.md#docs)
- [end](TemplateParameterDeclarationNode.md#end)
- [flags](TemplateParameterDeclarationNode.md#flags)
- [id](TemplateParameterDeclarationNode.md#id)
- [kind](TemplateParameterDeclarationNode.md#kind)
- [parent](TemplateParameterDeclarationNode.md#parent)
- [pos](TemplateParameterDeclarationNode.md#pos)
- [symbol](TemplateParameterDeclarationNode.md#symbol)

## Properties

### constraint

• `Optional` `Readonly` **constraint**: [`Expression`](../index.md#expression)

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

#### Inherited from

[DeclarationNode](DeclarationNode.md).[id](DeclarationNode.md#id)

___

### kind

• `Readonly` **kind**: [`TemplateParameterDeclaration`](../enums/SyntaxKind.md#templateparameterdeclaration)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

___

### parent

• `Optional` `Readonly` **parent**: [`TemplateableNode`](../index.md#templateablenode)

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
