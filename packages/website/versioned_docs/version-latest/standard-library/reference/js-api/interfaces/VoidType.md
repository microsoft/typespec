[JS Api](../index.md) / VoidType

# Interface: VoidType

## Hierarchy

- [`IntrinsicType`](IntrinsicType.md)

  ↳ **`VoidType`**

## Table of contents

### Properties

- [instantiationParameters](VoidType.md#instantiationparameters)
- [isFinished](VoidType.md#isfinished)
- [kind](VoidType.md#kind)
- [name](VoidType.md#name)
- [node](VoidType.md#node)
- [projectionBase](VoidType.md#projectionbase)
- [projectionSource](VoidType.md#projectionsource)
- [projector](VoidType.md#projector)

### Accessors

- [projections](VoidType.md#projections)

### Methods

- [projectionsByName](VoidType.md#projectionsbyname)

## Properties

### instantiationParameters

• `Optional` **instantiationParameters**: [`Type`](../index.md#type)[]

#### Inherited from

[IntrinsicType](IntrinsicType.md).[instantiationParameters](IntrinsicType.md#instantiationparameters)

___

### isFinished

• **isFinished**: `boolean`

Reflect if a type has been finished(Decorators have been called).
There is multiple reasons a type might not be finished:
- a template declaration will not
- a template instance that argument that are still template parameters
- a template instance that is only partially instantiated(like a templated operation inside a templated interface)

#### Inherited from

[IntrinsicType](IntrinsicType.md).[isFinished](IntrinsicType.md#isfinished)

___

### kind

• **kind**: ``"Intrinsic"``

#### Inherited from

[IntrinsicType](IntrinsicType.md).[kind](IntrinsicType.md#kind)

___

### name

• **name**: ``"void"``

#### Overrides

[IntrinsicType](IntrinsicType.md).[name](IntrinsicType.md#name)

___

### node

• `Optional` **node**: [`Node`](../index.md#node)

#### Inherited from

[IntrinsicType](IntrinsicType.md).[node](IntrinsicType.md#node)

___

### projectionBase

• `Optional` **projectionBase**: [`Type`](../index.md#type)

#### Inherited from

[IntrinsicType](IntrinsicType.md).[projectionBase](IntrinsicType.md#projectionbase)

___

### projectionSource

• `Optional` **projectionSource**: [`Type`](../index.md#type)

#### Inherited from

[IntrinsicType](IntrinsicType.md).[projectionSource](IntrinsicType.md#projectionsource)

___

### projector

• `Optional` **projector**: [`Projector`](Projector.md)

#### Inherited from

[IntrinsicType](IntrinsicType.md).[projector](IntrinsicType.md#projector)

## Accessors

### projections

• `get` **projections**(): [`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Returns

[`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Inherited from

IntrinsicType.projections

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

[IntrinsicType](IntrinsicType.md).[projectionsByName](IntrinsicType.md#projectionsbyname)
