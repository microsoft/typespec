[JS Api](../index.md) / FunctionParameterNode

# Interface: FunctionParameterNode

## Hierarchy

- [`BaseNode`](BaseNode.md)

  ↳ **`FunctionParameterNode`**

## Table of contents

### Properties

- [directives](FunctionParameterNode.md#directives)
- [docs](FunctionParameterNode.md#docs)
- [end](FunctionParameterNode.md#end)
- [flags](FunctionParameterNode.md#flags)
- [id](FunctionParameterNode.md#id)
- [kind](FunctionParameterNode.md#kind)
- [optional](FunctionParameterNode.md#optional)
- [parent](FunctionParameterNode.md#parent)
- [pos](FunctionParameterNode.md#pos)
- [rest](FunctionParameterNode.md#rest)
- [symbol](FunctionParameterNode.md#symbol)
- [type](FunctionParameterNode.md#type)

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

___

### kind

• `Readonly` **kind**: [`FunctionParameter`](../enums/SyntaxKind.md#functionparameter)

#### Overrides

[BaseNode](BaseNode.md).[kind](BaseNode.md#kind)

___

### optional

• `Readonly` **optional**: `boolean`

Parameter defined with `?`

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

### rest

• `Readonly` **rest**: `boolean`

Parameter defined with `...` notation.

___

### symbol

• `Readonly` **symbol**: [`Sym`](Sym.md)

Could be undefined but making this optional creates a lot of noise. In practice,
you will likely only access symbol in cases where you know the node has a symbol.

#### Inherited from

[BaseNode](BaseNode.md).[symbol](BaseNode.md#symbol)

___

### type

• `Optional` `Readonly` **type**: [`Expression`](../index.md#expression)
