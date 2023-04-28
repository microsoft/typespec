[JS Api](../index.md) / Scalar

# Interface: Scalar

## Hierarchy

- [`BaseType`](BaseType.md)

- [`DecoratedType`](DecoratedType.md)

- [`TemplatedTypeBase`](TemplatedTypeBase.md)

  ↳ **`Scalar`**

## Table of contents

### Properties

- [baseScalar](Scalar.md#basescalar)
- [decorators](Scalar.md#decorators)
- [derivedScalars](Scalar.md#derivedscalars)
- [instantiationParameters](Scalar.md#instantiationparameters)
- [kind](Scalar.md#kind)
- [name](Scalar.md#name)
- [namespace](Scalar.md#namespace)
- [node](Scalar.md#node)
- [projectionBase](Scalar.md#projectionbase)
- [projectionSource](Scalar.md#projectionsource)
- [projector](Scalar.md#projector)
- [symbol](Scalar.md#symbol)
- [templateArguments](Scalar.md#templatearguments)
- [templateMapper](Scalar.md#templatemapper)
- [templateNode](Scalar.md#templatenode)

### Accessors

- [projections](Scalar.md#projections)

### Methods

- [projectionsByName](Scalar.md#projectionsbyname)

## Properties

### baseScalar

• `Optional` **baseScalar**: [`Scalar`](Scalar.md)

Scalar this scalar extends.

___

### decorators

• **decorators**: [`DecoratorApplication`](DecoratorApplication.md)[]

#### Inherited from

[DecoratedType](DecoratedType.md).[decorators](DecoratedType.md#decorators)

___

### derivedScalars

• **derivedScalars**: [`Scalar`](Scalar.md)[]

Direct children. This is the reverse relation of

**`See`**

baseScalar

___

### instantiationParameters

• `Optional` **instantiationParameters**: [`Type`](../index.md#type)[]

#### Inherited from

[BaseType](BaseType.md).[instantiationParameters](BaseType.md#instantiationparameters)

___

### kind

• **kind**: ``"Scalar"``

#### Overrides

[BaseType](BaseType.md).[kind](BaseType.md#kind)

___

### name

• **name**: `string`

___

### namespace

• `Optional` **namespace**: [`Namespace`](Namespace.md)

Namespace the scalar was defined in.

___

### node

• **node**: [`ScalarStatementNode`](ScalarStatementNode.md)

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
