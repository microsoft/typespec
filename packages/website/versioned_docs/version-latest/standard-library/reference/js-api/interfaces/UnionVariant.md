[JS Api](../index.md) / UnionVariant

# Interface: UnionVariant

## Hierarchy

- [`BaseType`](BaseType.md)

- [`DecoratedType`](DecoratedType.md)

  ↳ **`UnionVariant`**

## Table of contents

### Properties

- [decorators](UnionVariant.md#decorators)
- [instantiationParameters](UnionVariant.md#instantiationparameters)
- [kind](UnionVariant.md#kind)
- [name](UnionVariant.md#name)
- [node](UnionVariant.md#node)
- [projectionBase](UnionVariant.md#projectionbase)
- [projectionSource](UnionVariant.md#projectionsource)
- [projector](UnionVariant.md#projector)
- [type](UnionVariant.md#type)
- [union](UnionVariant.md#union)

### Accessors

- [projections](UnionVariant.md#projections)

### Methods

- [projectionsByName](UnionVariant.md#projectionsbyname)

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

• **kind**: ``"UnionVariant"``

#### Overrides

[BaseType](BaseType.md).[kind](BaseType.md#kind)

___

### name

• **name**: `string` \| `symbol`

___

### node

• **node**: `undefined` \| [`UnionVariantNode`](UnionVariantNode.md)

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

___

### type

• **type**: [`Type`](../index.md#type)

___

### union

• **union**: [`Union`](Union.md)

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
