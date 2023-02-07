[JS Api](../index.md) / Union

# Interface: Union

## Hierarchy

- [`BaseType`](BaseType.md)

- [`DecoratedType`](DecoratedType.md)

- [`TemplatedTypeBase`](TemplatedTypeBase.md)

  ↳ **`Union`**

## Table of contents

### Properties

- [decorators](Union.md#decorators)
- [expression](Union.md#expression)
- [instantiationParameters](Union.md#instantiationparameters)
- [kind](Union.md#kind)
- [name](Union.md#name)
- [namespace](Union.md#namespace)
- [node](Union.md#node)
- [options](Union.md#options)
- [projectionBase](Union.md#projectionbase)
- [projectionSource](Union.md#projectionsource)
- [projector](Union.md#projector)
- [symbol](Union.md#symbol)
- [templateArguments](Union.md#templatearguments)
- [templateMapper](Union.md#templatemapper)
- [templateNode](Union.md#templatenode)
- [variants](Union.md#variants)

### Accessors

- [projections](Union.md#projections)

### Methods

- [projectionsByName](Union.md#projectionsbyname)

## Properties

### decorators

• **decorators**: [`DecoratorApplication`](DecoratorApplication.md)[]

#### Inherited from

[DecoratedType](DecoratedType.md).[decorators](DecoratedType.md#decorators)

___

### expression

• **expression**: `boolean`

___

### instantiationParameters

• `Optional` **instantiationParameters**: [`Type`](../index.md#type)[]

#### Inherited from

[BaseType](BaseType.md).[instantiationParameters](BaseType.md#instantiationparameters)

___

### kind

• **kind**: ``"Union"``

#### Overrides

[BaseType](BaseType.md).[kind](BaseType.md#kind)

___

### name

• `Optional` **name**: `string`

___

### namespace

• `Optional` **namespace**: [`Namespace`](Namespace.md)

___

### node

• **node**: [`UnionStatementNode`](UnionStatementNode.md) \| [`UnionExpressionNode`](UnionExpressionNode.md)

#### Overrides

[BaseType](BaseType.md).[node](BaseType.md#node)

___

### options

• `Readonly` **options**: [`Type`](../index.md#type)[]

**`Deprecated`**

use variants

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

Late-bound symbol of this interface type.

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

___

### variants

• **variants**: `Map`<`string` \| `symbol`, [`UnionVariant`](UnionVariant.md)\>

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
