[JS Api](../index.md) / TypeReferenceNode

# Interface: TypeReferenceNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

  ↳ **`TypeReferenceNode`**

## Table of contents

### Properties

- [arguments](TypeReferenceNode.md#arguments)
- [directives](TypeReferenceNode.md#directives)
- [docs](TypeReferenceNode.md#docs)
- [end](TypeReferenceNode.md#end)
- [flags](TypeReferenceNode.md#flags)
- [kind](TypeReferenceNode.md#kind)
- [parent](TypeReferenceNode.md#parent)
- [pos](TypeReferenceNode.md#pos)
- [symbol](TypeReferenceNode.md#symbol)
- [target](TypeReferenceNode.md#target)

## Properties

### arguments

• `Readonly` **arguments**: readonly [`Expression`](../index.md#expression)[]

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

• `Readonly` **kind**: [`TypeReference`](../enums/SyntaxKind.md#typereference)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

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

___

### target

• `Readonly` **target**: [`MemberExpressionNode`](MemberExpressionNode.md) \| [`IdentifierNode`](IdentifierNode.md)
