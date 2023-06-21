[JS Api](../index.md) / BooleanLiteral

# Interface: BooleanLiteral

## Hierarchy

- [`BaseType`](BaseType.md)

  ↳ **`BooleanLiteral`**

## Table of contents

### Properties

- [instantiationParameters](BooleanLiteral.md#instantiationparameters)
- [isFinished](BooleanLiteral.md#isfinished)
- [kind](BooleanLiteral.md#kind)
- [node](BooleanLiteral.md#node)
- [projectionBase](BooleanLiteral.md#projectionbase)
- [projectionSource](BooleanLiteral.md#projectionsource)
- [projector](BooleanLiteral.md#projector)
- [value](BooleanLiteral.md#value)

### Accessors

- [projections](BooleanLiteral.md#projections)

### Methods

- [projectionsByName](BooleanLiteral.md#projectionsbyname)

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

• **kind**: ``"Boolean"``

#### Overrides

[BaseType](BaseType.md).[kind](BaseType.md#kind)

___

### node

• `Optional` **node**: [`BooleanLiteralNode`](BooleanLiteralNode.md)

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

### value

• **value**: `boolean`

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
