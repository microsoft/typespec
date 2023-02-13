[JS Api](../index.md) / Enum

# Interface: Enum

## Hierarchy

- [`BaseType`](BaseType.md)

- [`DecoratedType`](DecoratedType.md)

  ↳ **`Enum`**

## Table of contents

### Properties

- [decorators](Enum.md#decorators)
- [instantiationParameters](Enum.md#instantiationparameters)
- [kind](Enum.md#kind)
- [members](Enum.md#members)
- [name](Enum.md#name)
- [namespace](Enum.md#namespace)
- [node](Enum.md#node)
- [projectionBase](Enum.md#projectionbase)
- [projectionSource](Enum.md#projectionsource)
- [projector](Enum.md#projector)

### Accessors

- [projections](Enum.md#projections)

### Methods

- [projectionsByName](Enum.md#projectionsbyname)

## Properties

### decorators

• **decorators**: [`DecoratorApplication`](DecoratorApplication.md)[]

#### Inherited from

[DecoratedType](DecoratedType.md).[decorators](DecoratedType.md#decorators)

___

### instantiationParameters

• `Optional` **instantiationParameters**: [`Type`](../index.md#type)[]

#### Inherited from

[BaseType](BaseType.md).[instantiationParameters](BaseType.md#instantiationparameters)

___

### kind

• **kind**: ``"Enum"``

#### Overrides

[BaseType](BaseType.md).[kind](BaseType.md#kind)

___

### members

• **members**: `Map`<`string`, [`EnumMember`](EnumMember.md)\>

___

### name

• **name**: `string`

___

### namespace

• `Optional` **namespace**: [`Namespace`](Namespace.md)

___

### node

• **node**: [`EnumStatementNode`](EnumStatementNode.md)

#### Overrides

[BaseType](BaseType.md).[node](BaseType.md#node)

___

### projectionBase

• `Optional` **projectionBase**: [`Type`](../index.md#type)

#### Inherited from

[BaseType](BaseType.md).[projectionBase](BaseType.md#projectionbase)

___

### projectionSource

• `Optional` **projectionSource**: [`Type`](../index.md#type)

#### Inherited from

[BaseType](BaseType.md).[projectionSource](BaseType.md#projectionsource)

___

### projector

• `Optional` **projector**: [`Projector`](Projector.md)

#### Inherited from

[BaseType](BaseType.md).[projector](BaseType.md#projector)

## Accessors

### projections

• `get` **projections**(): [`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Returns

[`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Inherited from

BaseType.projections

## Methods

### projectionsByName

▸ **projectionsByName**(`name`): [`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

[`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Inherited from

[BaseType](BaseType.md).[projectionsByName](BaseType.md#projectionsbyname)
