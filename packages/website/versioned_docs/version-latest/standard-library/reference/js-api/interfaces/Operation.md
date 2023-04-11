[JS Api](../index.md) / Operation

# Interface: Operation

## Hierarchy

- [`BaseType`](BaseType.md)

- [`DecoratedType`](DecoratedType.md)

- [`TemplatedTypeBase`](TemplatedTypeBase.md)

  ↳ **`Operation`**

## Table of contents

### Properties

- [decorators](Operation.md#decorators)
- [instantiationParameters](Operation.md#instantiationparameters)
- [interface](Operation.md#interface)
- [kind](Operation.md#kind)
- [name](Operation.md#name)
- [namespace](Operation.md#namespace)
- [node](Operation.md#node)
- [parameters](Operation.md#parameters)
- [projectionBase](Operation.md#projectionbase)
- [projectionSource](Operation.md#projectionsource)
- [projector](Operation.md#projector)
- [returnType](Operation.md#returntype)
- [templateArguments](Operation.md#templatearguments)
- [templateMapper](Operation.md#templatemapper)
- [templateNode](Operation.md#templatenode)

### Accessors

- [projections](Operation.md#projections)

### Methods

- [projectionsByName](Operation.md#projectionsbyname)

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

### interface

• `Optional` **interface**: [`Interface`](Interface.md)

___

### kind

• **kind**: ``"Operation"``

#### Overrides

[BaseType](BaseType.md).[kind](BaseType.md#kind)

___

### name

• **name**: `string`

___

### namespace

• `Optional` **namespace**: [`Namespace`](Namespace.md)

___

### node

• **node**: [`OperationStatementNode`](OperationStatementNode.md)

#### Overrides

[BaseType](BaseType.md).[node](BaseType.md#node)

___

### parameters

• **parameters**: [`Model`](Model.md)

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

### returnType

• **returnType**: [`Type`](../index.md#type)

___

### templateArguments

• `Optional` **templateArguments**: [`Type`](../index.md#type)[]

**`Deprecated`**

use templateMapper instead.

#### Inherited from

[TemplatedTypeBase](TemplatedTypeBase.md).[templateArguments](TemplatedTypeBase.md#templatearguments)

___

### templateMapper

• `Optional` **templateMapper**: [`TypeMapper`](TypeMapper.md)

#### Inherited from

[TemplatedTypeBase](TemplatedTypeBase.md).[templateMapper](TemplatedTypeBase.md#templatemapper)

___

### templateNode

• `Optional` **templateNode**: [`Node`](../index.md#node)

#### Inherited from

[TemplatedTypeBase](TemplatedTypeBase.md).[templateNode](TemplatedTypeBase.md#templatenode)

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
