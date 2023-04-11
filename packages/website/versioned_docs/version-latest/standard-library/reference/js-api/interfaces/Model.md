[JS Api](../index.md) / Model

# Interface: Model

## Hierarchy

- [`BaseType`](BaseType.md)

- [`DecoratedType`](DecoratedType.md)

- [`TemplatedTypeBase`](TemplatedTypeBase.md)

  ↳ **`Model`**

  ↳↳ [`ArrayModelType`](ArrayModelType.md)

  ↳↳ [`RecordModelType`](RecordModelType.md)

## Table of contents

### Properties

- [baseModel](Model.md#basemodel)
- [decorators](Model.md#decorators)
- [derivedModels](Model.md#derivedmodels)
- [indexer](Model.md#indexer)
- [instantiationParameters](Model.md#instantiationparameters)
- [kind](Model.md#kind)
- [name](Model.md#name)
- [namespace](Model.md#namespace)
- [node](Model.md#node)
- [projectionBase](Model.md#projectionbase)
- [projectionSource](Model.md#projectionsource)
- [projector](Model.md#projector)
- [properties](Model.md#properties)
- [symbol](Model.md#symbol)
- [templateArguments](Model.md#templatearguments)
- [templateMapper](Model.md#templatemapper)
- [templateNode](Model.md#templatenode)

### Accessors

- [projections](Model.md#projections)

### Methods

- [projectionsByName](Model.md#projectionsbyname)

## Properties

### baseModel

• `Optional` **baseModel**: [`Model`](Model.md)

Model this model extends. This represent inheritance.

___

### decorators

• **decorators**: [`DecoratorApplication`](DecoratorApplication.md)[]

#### Inherited from

[DecoratedType](DecoratedType.md).[decorators](DecoratedType.md#decorators)

___

### derivedModels

• **derivedModels**: [`Model`](Model.md)[]

Direct children. This is the reverse relation of [baseModel](Model.md#basemodel)

___

### indexer

• `Optional` **indexer**: [`ModelIndexer`](../index.md#modelindexer)

___

### instantiationParameters

• `Optional` **instantiationParameters**: [`Type`](../index.md#type)[]

#### Inherited from

[BaseType](BaseType.md).[instantiationParameters](BaseType.md#instantiationparameters)

___

### kind

• **kind**: ``"Model"``

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

• `Optional` **node**: [`ModelStatementNode`](ModelStatementNode.md) \| [`ModelExpressionNode`](ModelExpressionNode.md) \| [`IntersectionExpressionNode`](IntersectionExpressionNode.md) \| [`ProjectionModelExpressionNode`](ProjectionModelExpressionNode.md)

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

### properties

• **properties**: [`RekeyableMap`](RekeyableMap.md)<`string`, [`ModelProperty`](ModelProperty.md)\>

The properties of the model.

Properties are ordered in the order that they appear in source.
Properties obtained via `model is` appear before properties defined in
the model body. Properties obtained via `...` are inserted where the
spread appears in source.

Properties inherited via `model extends` are not included. Use
[walkPropertiesInherited](../index.md#walkpropertiesinherited) to enumerate all properties in the
inheritance hierarchy.

___

### symbol

• `Optional` **symbol**: [`Sym`](Sym.md)

Late-bound symbol of this model type.

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
