[JS Api](../index.md) / FunctionDeclarationStatementNode

# Interface: FunctionDeclarationStatementNode

Represent a function declaration

**`Example`**

```typespec
extern fn camelCase(value: StringLiteral): StringLiteral;
```

## Hierarchy

- [`BaseNode`](BaseNode.md)

- [`DeclarationNode`](DeclarationNode.md)

  ↳ **`FunctionDeclarationStatementNode`**

## Table of contents

### Properties

- [directives](FunctionDeclarationStatementNode.md#directives)
- [docs](FunctionDeclarationStatementNode.md#docs)
- [end](FunctionDeclarationStatementNode.md#end)
- [flags](FunctionDeclarationStatementNode.md#flags)
- [id](FunctionDeclarationStatementNode.md#id)
- [kind](FunctionDeclarationStatementNode.md#kind)
- [modifierFlags](FunctionDeclarationStatementNode.md#modifierflags)
- [modifiers](FunctionDeclarationStatementNode.md#modifiers)
- [parameters](FunctionDeclarationStatementNode.md#parameters)
- [parent](FunctionDeclarationStatementNode.md#parent)
- [pos](FunctionDeclarationStatementNode.md#pos)
- [returnType](FunctionDeclarationStatementNode.md#returntype)
- [symbol](FunctionDeclarationStatementNode.md#symbol)

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

• `Readonly` **kind**: [`FunctionDeclarationStatement`](../enums/SyntaxKind.md#functiondeclarationstatement)

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

### returnType

• `Optional` `Readonly` **returnType**: [`Expression`](../index.md#expression)

___

### symbol

• `Readonly` **symbol**: [`Sym`](Sym.md)

Could be undefined but making this optional creates a lot of noise. In practice,
you will likely only access symbol in cases where you know the node has a symbol.

#### Inherited from

[BaseNode](BaseNode.md).[symbol](BaseNode.md#symbol)
