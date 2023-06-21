[JS Api](../index.md) / ModelProperty

# Interface: ModelProperty

## Hierarchy

- [`BaseType`](BaseType.md)

- [`DecoratedType`](DecoratedType.md)

  ↳ **`ModelProperty`**

## Table of contents

### Properties

- [decorators](ModelProperty.md#decorators)
- [default](ModelProperty.md#default)
- [instantiationParameters](ModelProperty.md#instantiationparameters)
- [isFinished](ModelProperty.md#isfinished)
- [kind](ModelProperty.md#kind)
- [model](ModelProperty.md#model)
- [name](ModelProperty.md#name)
- [node](ModelProperty.md#node)
- [optional](ModelProperty.md#optional)
- [projectionBase](ModelProperty.md#projectionbase)
- [projectionSource](ModelProperty.md#projectionsource)
- [projector](ModelProperty.md#projector)
- [sourceProperty](ModelProperty.md#sourceproperty)
- [type](ModelProperty.md#type)

### Accessors

- [projections](ModelProperty.md#projections)

### Methods

- [projectionsByName](ModelProperty.md#projectionsbyname)

## Properties

### decorators

• **decorators**: [`DecoratorApplication`](DecoratorApplication.md)[]

#### Inherited from

[DecoratedType](DecoratedType.md).[decorators](DecoratedType.md#decorators)

___

### default

• `Optional` **default**: [`Type`](../index.md#type)

___

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

• **kind**: ``"ModelProperty"``

#### Overrides

[BaseType](BaseType.md).[kind](BaseType.md#kind)

___

### model

• `Optional` **model**: [`Model`](Model.md)

___

### name

• **name**: `string`

___

### node

• **node**: [`ModelPropertyNode`](ModelPropertyNode.md) \| [`ModelSpreadPropertyNode`](ModelSpreadPropertyNode.md) \| [`ProjectionModelPropertyNode`](ProjectionModelPropertyNode.md) \| [`ProjectionModelSpreadPropertyNode`](ProjectionModelSpreadPropertyNode.md)

#### Overrides

[BaseType](BaseType.md).[node](BaseType.md#node)

___

### optional

• **optional**: `boolean`

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

### sourceProperty

• `Optional` **sourceProperty**: [`ModelProperty`](ModelProperty.md)

___

### type

• **type**: [`Type`](../index.md#type)

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
