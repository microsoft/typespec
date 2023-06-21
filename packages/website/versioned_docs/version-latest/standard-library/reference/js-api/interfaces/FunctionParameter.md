[JS Api](../index.md) / FunctionParameter

# Interface: FunctionParameter

## Hierarchy

- [`BaseType`](BaseType.md)

  ↳ **`FunctionParameter`**

## Table of contents

### Properties

- [instantiationParameters](FunctionParameter.md#instantiationparameters)
- [isFinished](FunctionParameter.md#isfinished)
- [kind](FunctionParameter.md#kind)
- [name](FunctionParameter.md#name)
- [node](FunctionParameter.md#node)
- [optional](FunctionParameter.md#optional)
- [projectionBase](FunctionParameter.md#projectionbase)
- [projectionSource](FunctionParameter.md#projectionsource)
- [projector](FunctionParameter.md#projector)
- [rest](FunctionParameter.md#rest)
- [type](FunctionParameter.md#type)

### Accessors

- [projections](FunctionParameter.md#projections)

### Methods

- [projectionsByName](FunctionParameter.md#projectionsbyname)

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

• **kind**: ``"FunctionParameter"``

#### Overrides

[BaseType](BaseType.md).[kind](BaseType.md#kind)

___

### name

• **name**: `string`

___

### node

• **node**: [`FunctionParameterNode`](FunctionParameterNode.md)

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

### rest

• **rest**: `boolean`

___

### type

• **type**: [`Type`](../index.md#type) \| [`ValueType`](ValueType.md)

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
