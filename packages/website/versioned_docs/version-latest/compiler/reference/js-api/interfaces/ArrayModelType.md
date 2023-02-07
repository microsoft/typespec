[JS Api](../index.md) / ArrayModelType

# Interface: ArrayModelType

## Hierarchy

- [`Model`](Model.md)

  ↳ **`ArrayModelType`**

## Table of contents

### Properties

- [baseModel](ArrayModelType.md#basemodel)
- [decorators](ArrayModelType.md#decorators)
- [derivedModels](ArrayModelType.md#derivedmodels)
- [indexer](ArrayModelType.md#indexer)
- [instantiationParameters](ArrayModelType.md#instantiationparameters)
- [kind](ArrayModelType.md#kind)
- [name](ArrayModelType.md#name)
- [namespace](ArrayModelType.md#namespace)
- [node](ArrayModelType.md#node)
- [projectionBase](ArrayModelType.md#projectionbase)
- [projectionSource](ArrayModelType.md#projectionsource)
- [projector](ArrayModelType.md#projector)
- [properties](ArrayModelType.md#properties)
- [symbol](ArrayModelType.md#symbol)
- [templateArguments](ArrayModelType.md#templatearguments)
- [templateMapper](ArrayModelType.md#templatemapper)
- [templateNode](ArrayModelType.md#templatenode)

### Accessors

- [projections](ArrayModelType.md#projections)

### Methods

- [projectionsByName](ArrayModelType.md#projectionsbyname)

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

Direct children. This is the reverse relation of [baseModel](ArrayModelType.md#basemodel)

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
