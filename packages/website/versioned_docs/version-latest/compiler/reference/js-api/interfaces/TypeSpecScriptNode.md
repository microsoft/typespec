[JS Api](../index.md) / TypeSpecScriptNode

# Interface: TypeSpecScriptNode

## Hierarchy

- [`DeclarationNode`](DeclarationNode.md)

- [`BaseNode`](BaseNode.md)

  ↳ **`TypeSpecScriptNode`**

## Table of contents

### Properties

- [comments](TypeSpecScriptNode.md#comments)
- [directives](TypeSpecScriptNode.md#directives)
- [docs](TypeSpecScriptNode.md#docs)
- [end](TypeSpecScriptNode.md#end)
- [file](TypeSpecScriptNode.md#file)
- [flags](TypeSpecScriptNode.md#flags)
- [id](TypeSpecScriptNode.md#id)
- [inScopeNamespaces](TypeSpecScriptNode.md#inscopenamespaces)
- [kind](TypeSpecScriptNode.md#kind)
- [locals](TypeSpecScriptNode.md#locals)
- [namespaces](TypeSpecScriptNode.md#namespaces)
- [parent](TypeSpecScriptNode.md#parent)
- [parseDiagnostics](TypeSpecScriptNode.md#parsediagnostics)
- [parseOptions](TypeSpecScriptNode.md#parseoptions)
- [pos](TypeSpecScriptNode.md#pos)
- [printable](TypeSpecScriptNode.md#printable)
- [statements](TypeSpecScriptNode.md#statements)
- [symbol](TypeSpecScriptNode.md#symbol)
- [usings](TypeSpecScriptNode.md#usings)

## Properties

### comments

• `Readonly` **comments**: readonly [`Comment`](../index.md#comment)[]

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

### file

• `Readonly` **file**: [`SourceFile`](SourceFile.md)

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

### inScopeNamespaces

• `Readonly` **inScopeNamespaces**: readonly [`NamespaceStatementNode`](NamespaceStatementNode.md)[]

___

### kind

• `Readonly` **kind**: [`TypeSpecScript`](../enums/SyntaxKind.md#typespecscript)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

___

### locals

• `Readonly` **locals**: [`SymbolTable`](SymbolTable.md)

___

### namespaces

• `Readonly` **namespaces**: [`NamespaceStatementNode`](NamespaceStatementNode.md)[]

___

### parent

• `Optional` `Readonly` **parent**: [`Node`](../index.md#node)

#### Inherited from

[BaseNode](BaseNode.md).[parent](BaseNode.md#parent)

___

### parseDiagnostics

• `Readonly` **parseDiagnostics**: readonly [`Diagnostic`](Diagnostic.md)[]

___

### parseOptions

• `Readonly` **parseOptions**: [`ParseOptions`](ParseOptions.md)

___

### pos

• `Readonly` **pos**: `number`

The starting position of the ranger measured in UTF-16 code units from the
start of the full string. Inclusive.

#### Inherited from

[BaseNode](BaseNode.md).[pos](BaseNode.md#pos)

___

### printable

• `Readonly` **printable**: `boolean`

___

### statements

• `Readonly` **statements**: readonly [`Statement`](../index.md#statement)[]

___

### symbol

• `Readonly` **symbol**: [`Sym`](Sym.md)

Could be undefined but making this optional creates a lot of noise. In practice,
you will likely only access symbol in cases where you know the node has a symbol.

#### Inherited from

[BaseNode](BaseNode.md).[symbol](BaseNode.md#symbol)

___

### usings

• `Readonly` **usings**: readonly [`UsingStatementNode`](UsingStatementNode.md)[]
