[JS Api](../index.md) / DecoratorDeclarationStatementNode

# Interface: DecoratorDeclarationStatementNode

Represent a decorator declaration

**`Example`**

```typespec
extern dec doc(target: Type, value: valueof string);
```

## Hierarchy

- [`BaseNode`](BaseNode.md)

- [`DeclarationNode`](DeclarationNode.md)

  ↳ **`DecoratorDeclarationStatementNode`**

## Table of contents

### Properties

- [directives](DecoratorDeclarationStatementNode.md#directives)
- [docs](DecoratorDeclarationStatementNode.md#docs)
- [end](DecoratorDeclarationStatementNode.md#end)
- [flags](DecoratorDeclarationStatementNode.md#flags)
- [id](DecoratorDeclarationStatementNode.md#id)
- [kind](DecoratorDeclarationStatementNode.md#kind)
- [modifierFlags](DecoratorDeclarationStatementNode.md#modifierflags)
- [modifiers](DecoratorDeclarationStatementNode.md#modifiers)
- [parameters](DecoratorDeclarationStatementNode.md#parameters)
- [parent](DecoratorDeclarationStatementNode.md#parent)
- [pos](DecoratorDeclarationStatementNode.md#pos)
- [symbol](DecoratorDeclarationStatementNode.md#symbol)
- [target](DecoratorDeclarationStatementNode.md#target)

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

### id

• `Readonly` **id**: [`IdentifierNode`](IdentifierNode.md)

#### Inherited from

[DeclarationNode](DeclarationNode.md).[id](DeclarationNode.md#id)

___

### kind

• `Readonly` **kind**: [`DecoratorDeclarationStatement`](../enums/SyntaxKind.md#decoratordeclarationstatement)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

___

### modifierFlags

• `Readonly` **modifierFlags**: [`ModifierFlags`](../enums/ModifierFlags.md)

___

### modifiers

• `Readonly` **modifiers**: readonly [`ExternKeywordNode`](ExternKeywordNode.md)[]

___

### parameters

• `Readonly` **parameters**: [`FunctionParameterNode`](FunctionParameterNode.md)[]

Additional parameters

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

### target

• `Readonly` **target**: [`FunctionParameterNode`](FunctionParameterNode.md)

Decorator target. First parameter.
