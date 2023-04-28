[JS Api](../index.md) / JsSourceFileNode

# Interface: JsSourceFileNode

## Hierarchy

- [`DeclarationNode`](DeclarationNode.md)

- [`BaseNode`](BaseNode.md)

  ↳ **`JsSourceFileNode`**

## Table of contents

### Properties

- [directives](JsSourceFileNode.md#directives)
- [docs](JsSourceFileNode.md#docs)
- [end](JsSourceFileNode.md#end)
- [esmExports](JsSourceFileNode.md#esmexports)
- [file](JsSourceFileNode.md#file)
- [flags](JsSourceFileNode.md#flags)
- [id](JsSourceFileNode.md#id)
- [kind](JsSourceFileNode.md#kind)
- [namespaceSymbols](JsSourceFileNode.md#namespacesymbols)
- [parent](JsSourceFileNode.md#parent)
- [pos](JsSourceFileNode.md#pos)
- [symbol](JsSourceFileNode.md#symbol)

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

### esmExports

• `Readonly` **esmExports**: `any`

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

### kind

• `Readonly` **kind**: [`JsSourceFile`](../enums/SyntaxKind.md#jssourcefile)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

___

### namespaceSymbols

• `Readonly` **namespaceSymbols**: [`Sym`](Sym.md)[]

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
