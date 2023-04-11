[JS Api](../index.md) / Projection

# Interface: Projection

## Hierarchy

- [`BaseType`](BaseType.md)

  ↳ **`Projection`**

## Table of contents

### Properties

- [instantiationParameters](Projection.md#instantiationparameters)
- [kind](Projection.md#kind)
- [node](Projection.md#node)
- [nodeByKind](Projection.md#nodebykind)
- [nodeByType](Projection.md#nodebytype)
- [projectionBase](Projection.md#projectionbase)
- [projectionSource](Projection.md#projectionsource)
- [projector](Projection.md#projector)

### Accessors

- [projections](Projection.md#projections)

### Methods

- [projectionsByName](Projection.md#projectionsbyname)

## Properties

### instantiationParameters

• `Optional` **instantiationParameters**: [`Type`](../index.md#type)[]

#### Inherited from

[BaseType](BaseType.md).[instantiationParameters](BaseType.md#instantiationparameters)

___

### kind

• **kind**: ``"Projection"``

#### Overrides

[BaseType](BaseType.md).[kind](BaseType.md#kind)

___

### node

• **node**: `undefined`

#### Overrides

[BaseType](BaseType.md).[node](BaseType.md#node)

___

### nodeByKind

• **nodeByKind**: `Map`<`string`, [`ProjectionStatementNode`](ProjectionStatementNode.md)\>

___

### nodeByType

• **nodeByType**: `Map`<[`Type`](../index.md#type), [`ProjectionStatementNode`](ProjectionStatementNode.md)\>

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
