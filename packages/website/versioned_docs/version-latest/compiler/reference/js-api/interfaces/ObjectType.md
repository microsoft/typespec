[JS Api](../index.md) / ObjectType

# Interface: ObjectType

## Hierarchy

- [`BaseType`](BaseType.md)

  ↳ **`ObjectType`**

## Table of contents

### Properties

- [instantiationParameters](ObjectType.md#instantiationparameters)
- [kind](ObjectType.md#kind)
- [node](ObjectType.md#node)
- [projectionBase](ObjectType.md#projectionbase)
- [projectionSource](ObjectType.md#projectionsource)
- [projector](ObjectType.md#projector)
- [properties](ObjectType.md#properties)

### Accessors

- [projections](ObjectType.md#projections)

### Methods

- [projectionsByName](ObjectType.md#projectionsbyname)

## Properties

### instantiationParameters

• `Optional` **instantiationParameters**: [`Type`](../index.md#type)[]

#### Inherited from

[BaseType](BaseType.md).[instantiationParameters](BaseType.md#instantiationparameters)

___

### kind

• **kind**: ``"Object"``

#### Overrides

[BaseType](BaseType.md).[kind](BaseType.md#kind)

___

### node

• `Optional` **node**: [`Node`](../index.md#node)

#### Inherited from

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

### properties

• **properties**: `Record`<`string`, [`Type`](../index.md#type)\>

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
