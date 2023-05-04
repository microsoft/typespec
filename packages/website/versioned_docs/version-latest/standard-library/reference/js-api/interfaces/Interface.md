[JS Api](../index.md) / Interface

# Interface: Interface

## Hierarchy

- [`BaseType`](BaseType.md)

- [`DecoratedType`](DecoratedType.md)

- [`TemplatedTypeBase`](TemplatedTypeBase.md)

  ↳ **`Interface`**

## Table of contents

### Properties

- [decorators](Interface.md#decorators)
- [instantiationParameters](Interface.md#instantiationparameters)
- [kind](Interface.md#kind)
- [name](Interface.md#name)
- [namespace](Interface.md#namespace)
- [node](Interface.md#node)
- [operations](Interface.md#operations)
- [projectionBase](Interface.md#projectionbase)
- [projectionSource](Interface.md#projectionsource)
- [projector](Interface.md#projector)
- [sourceInterfaces](Interface.md#sourceinterfaces)
- [symbol](Interface.md#symbol)
- [templateArguments](Interface.md#templatearguments)
- [templateMapper](Interface.md#templatemapper)
- [templateNode](Interface.md#templatenode)

### Accessors

- [projections](Interface.md#projections)

### Methods

- [projectionsByName](Interface.md#projectionsbyname)

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

### kind

• **kind**: ``"Interface"``

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

• **node**: [`InterfaceStatementNode`](InterfaceStatementNode.md)

#### Overrides

[BaseType](BaseType.md).[node](BaseType.md#node)

___

### operations

• **operations**: [`RekeyableMap`](RekeyableMap.md)<`string`, [`Operation`](Operation.md)\>

The operations of the interface.

Operations are ordered in the order that they appear in the source.
Operations obtained via `interface extends` appear before operations
declared in the interface body.

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

### sourceInterfaces

• **sourceInterfaces**: [`Interface`](Interface.md)[]

The interfaces that provide additional operations via `interface extends`.

Note that despite the same `extends` keyword in source form, this is a
different semantic relationship than the one from [Model](Model.md) to
[baseModel](Model.md#basemodel). Operations from extended interfaces are copied
into [operations](Interface.md#operations).

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
