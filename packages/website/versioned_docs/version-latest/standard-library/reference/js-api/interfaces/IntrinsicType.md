[JS Api](../index.md) / IntrinsicType

# Interface: IntrinsicType

## Hierarchy

- [`BaseType`](BaseType.md)

  ↳ **`IntrinsicType`**

  ↳↳ [`ErrorType`](ErrorType.md)

  ↳↳ [`VoidType`](VoidType.md)

  ↳↳ [`NeverType`](NeverType.md)

  ↳↳ [`UnknownType`](UnknownType.md)

  ↳↳ [`NullType`](NullType.md)

## Table of contents

### Properties

- [instantiationParameters](IntrinsicType.md#instantiationparameters)
- [isFinished](IntrinsicType.md#isfinished)
- [kind](IntrinsicType.md#kind)
- [name](IntrinsicType.md#name)
- [node](IntrinsicType.md#node)
- [projectionBase](IntrinsicType.md#projectionbase)
- [projectionSource](IntrinsicType.md#projectionsource)
- [projector](IntrinsicType.md#projector)

### Accessors

- [projections](IntrinsicType.md#projections)

### Methods

- [projectionsByName](IntrinsicType.md#projectionsbyname)

## Properties

### instantiationParameters

• `Optional` **instantiationParameters**: [`Type`](../index.md#type)[]

#### Inherited from

[BaseType](BaseType.md).[instantiationParameters](BaseType.md#instantiationparameters)

___

### isFinished

• **isFinished**: `boolean`

Reflect if a type has been finished(Decorators have been called).
There is multiple reasons a type might not be finished:
- a template declaration will not
- a template instance that argument that are still template parameters
- a template instance that is only partially instantiated(like a templated operation inside a templated interface)

#### Inherited from

[BaseType](BaseType.md).[isFinished](BaseType.md#isfinished)

___

### kind

• **kind**: ``"Intrinsic"``

#### Overrides

[BaseType](BaseType.md).[kind](BaseType.md#kind)

___

### name

• **name**: ``"unknown"`` \| ``"never"`` \| ``"null"`` \| ``"ErrorType"`` \| ``"void"``

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
