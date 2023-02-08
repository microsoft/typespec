[JS Api](../index.md) / Sym

# Interface: Sym

## Table of contents

### Properties

- [declarations](Sym.md#declarations)
- [exports](Sym.md#exports)
- [flags](Sym.md#flags)
- [id](Sym.md#id)
- [members](Sym.md#members)
- [name](Sym.md#name)
- [parent](Sym.md#parent)
- [symbolSource](Sym.md#symbolsource)
- [type](Sym.md#type)
- [value](Sym.md#value)

## Properties

### declarations

• `Readonly` **declarations**: readonly [`Node`](../index.md#node)[]

Nodes which contribute to this declaration

___

### exports

• `Optional` `Readonly` **exports**: [`SymbolTable`](SymbolTable.md)

Externally visible symbols contained inside this symbol. E.g. all declarations
in a namespace, or members of an enum.

___

### flags

• `Readonly` **flags**: [`SymbolFlags`](../enums/SymbolFlags.md)

___

### id

• `Optional` `Readonly` **id**: `number`

A unique identifier for this symbol. Used to look up the symbol links.

___

### members

• `Optional` `Readonly` **members**: [`SymbolTable`](SymbolTable.md)

Symbols for members of this symbol which must be referenced off the parent symbol
and cannot be referenced by other means (i.e. by unqualified lookup of the symbol
name).

___

### name

• `Readonly` **name**: `string`

The name of the symbol

___

### parent

• `Optional` `Readonly` **parent**: [`Sym`](Sym.md)

The symbol containing this symbol, if any. E.g. for things declared in
a namespace, this refers to the namespace.

___

### symbolSource

• `Optional` `Readonly` **symbolSource**: [`Sym`](Sym.md)

For using symbols, this is the used symbol.

___

### type

• `Optional` `Readonly` **type**: [`Type`](../index.md#type)

For late-bound symbols, this is the type referenced by the symbol.

___

### value

• `Optional` `Readonly` **value**: (...`args`: `any`[]) => `any`

#### Type declaration

▸ (`...args`): `any`

For decorator and function symbols, this is the JS function implementation.

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `any`[] |

##### Returns

`any`
