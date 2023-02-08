[JS Api](../index.md) / DecoratorDefinition

# Interface: DecoratorDefinition<T, P, S\>

## Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends [`TypeKind`](../index.md#typekind) |
| `P` | extends readonly [`DecoratorParamDefinition`](DecoratorParamDefinition.md)<[`TypeKind`](../index.md#typekind)\>[] |
| `S` | extends [`DecoratorParamDefinition`](DecoratorParamDefinition.md)<[`TypeKind`](../index.md#typekind)\> \| `undefined` = `undefined` |

## Table of contents

### Properties

- [args](DecoratorDefinition.md#args)
- [name](DecoratorDefinition.md#name)
- [spreadArgs](DecoratorDefinition.md#spreadargs)
- [target](DecoratorDefinition.md#target)

## Properties

### args

• `Readonly` **args**: `P`

List of positional arguments in the function.

___

### name

• `Readonly` **name**: `string`

Name of the decorator.

___

### spreadArgs

• `Optional` `Readonly` **spreadArgs**: `S`

**`Optional`**

Type of the spread args at the end of the function if applicable.

___

### target

• `Readonly` **target**: `T` \| readonly `T`[]

Decorator target.
