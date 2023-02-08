[JS Api](../index.md) / RecordModelType

# Interface: RecordModelType

## Hierarchy

- [`Model`](Model.md)

  ↳ **`RecordModelType`**

## Table of contents

### Properties

- [baseModel](RecordModelType.md#basemodel)
- [decorators](RecordModelType.md#decorators)
- [derivedModels](RecordModelType.md#derivedmodels)
- [indexer](RecordModelType.md#indexer)
- [instantiationParameters](RecordModelType.md#instantiationparameters)
- [kind](RecordModelType.md#kind)
- [name](RecordModelType.md#name)
- [namespace](RecordModelType.md#namespace)
- [node](RecordModelType.md#node)
- [projectionBase](RecordModelType.md#projectionbase)
- [projectionSource](RecordModelType.md#projectionsource)
- [projector](RecordModelType.md#projector)
- [properties](RecordModelType.md#properties)
- [symbol](RecordModelType.md#symbol)
- [templateArguments](RecordModelType.md#templatearguments)
- [templateMapper](RecordModelType.md#templatemapper)
- [templateNode](RecordModelType.md#templatenode)

### Accessors

- [projections](RecordModelType.md#projections)

### Methods

- [projectionsByName](RecordModelType.md#projectionsbyname)

## Properties

### baseModel

• `Optional` **baseModel**: [`Model`](Model.md)

Model this model extends. This represent inheritance.

#### Inherited from

[Model](Model.md).[baseModel](Model.md#basemodel)

___

### decorators

• **decorators**: [`DecoratorApplication`](DecoratorApplication.md)[]

#### Inherited from

[Model](Model.md).[decorators](Model.md#decorators)

___

### derivedModels

• **derivedModels**: [`Model`](Model.md)[]

Direct children. This is the reverse relation of [baseModel](RecordModelType.md#basemodel)

#### Inherited from

[Model](Model.md).[derivedModels](Model.md#derivedmodels)

___

### indexer

• **indexer**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `key` | [`Scalar`](Scalar.md) |
| `value` | [`Type`](../index.md#type) |

#### Overrides

[Model](Model.md).[indexer](Model.md#indexer)

___

### instantiationParameters

• `Optional` **instantiationParameters**: [`Type`](../index.md#type)[]

#### Inherited from

[Model](Model.md).[instantiationParameters](Model.md#instantiationparameters)

___

### kind

• **kind**: ``"Model"``

#### Inherited from

[Model](Model.md).[kind](Model.md#kind)

___

### name

• **name**: `string`

#### Inherited from

[Model](Model.md).[name](Model.md#name)

___

### namespace

• `Optional` **namespace**: [`Namespace`](Namespace.md)

#### Inherited from

[Model](Model.md).[namespace](Model.md#namespace)

___

### node

• `Optional` **node**: [`ModelStatementNode`](ModelStatementNode.md) \| [`ModelExpressionNode`](ModelExpressionNode.md) \| [`IntersectionExpressionNode`](IntersectionExpressionNode.md) \| [`ProjectionModelExpressionNode`](ProjectionModelExpressionNode.md)

#### Inherited from

[Model](Model.md).[node](Model.md#node)

___

### projectionBase

• `Optional` **projectionBase**: [`Type`](../index.md#type)

#### Inherited from

[Model](Model.md).[projectionBase](Model.md#projectionbase)

___

### projectionSource

• `Optional` **projectionSource**: [`Type`](../index.md#type)

#### Inherited from

[Model](Model.md).[projectionSource](Model.md#projectionsource)

___

### projector

• `Optional` **projector**: [`Projector`](Projector.md)

#### Inherited from

[Model](Model.md).[projector](Model.md#projector)

___

### properties

• **properties**: `Map`<`string`, [`ModelProperty`](ModelProperty.md)\>

#### Inherited from

[Model](Model.md).[properties](Model.md#properties)

___

### symbol

• `Optional` **symbol**: [`Sym`](Sym.md)

Late-bound symbol of this model type.

#### Inherited from

[Model](Model.md).[symbol](Model.md#symbol)

___

### templateArguments

• `Optional` **templateArguments**: [`Type`](../index.md#type)[]

**`Deprecated`**

use templateMapper instead.

#### Inherited from

[Model](Model.md).[templateArguments](Model.md#templatearguments)

___

### templateMapper

• `Optional` **templateMapper**: [`TypeMapper`](TypeMapper.md)

#### Inherited from

[Model](Model.md).[templateMapper](Model.md#templatemapper)

___

### templateNode

• `Optional` **templateNode**: [`Node`](../index.md#node)

#### Inherited from

[Model](Model.md).[templateNode](Model.md#templatenode)

## Accessors

### projections

• `get` **projections**(): [`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Returns

[`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Inherited from

Model.projections

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

[Model](Model.md).[projectionsByName](Model.md#projectionsbyname)
