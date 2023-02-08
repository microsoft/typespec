[JS Api](../index.md) / Namespace

# Interface: Namespace

## Hierarchy

- [`BaseType`](BaseType.md)

- [`DecoratedType`](DecoratedType.md)

  ↳ **`Namespace`**

## Table of contents

### Properties

- [decoratorDeclarations](Namespace.md#decoratordeclarations)
- [decorators](Namespace.md#decorators)
- [enums](Namespace.md#enums)
- [functionDeclarations](Namespace.md#functiondeclarations)
- [instantiationParameters](Namespace.md#instantiationparameters)
- [interfaces](Namespace.md#interfaces)
- [kind](Namespace.md#kind)
- [models](Namespace.md#models)
- [name](Namespace.md#name)
- [namespace](Namespace.md#namespace)
- [namespaces](Namespace.md#namespaces)
- [node](Namespace.md#node)
- [operations](Namespace.md#operations)
- [projectionBase](Namespace.md#projectionbase)
- [projectionSource](Namespace.md#projectionsource)
- [projector](Namespace.md#projector)
- [scalars](Namespace.md#scalars)
- [unions](Namespace.md#unions)

### Accessors

- [projections](Namespace.md#projections)

### Methods

- [projectionsByName](Namespace.md#projectionsbyname)

## Properties

### decoratorDeclarations

• **decoratorDeclarations**: `Map`<`string`, [`Decorator`](Decorator.md)\>

___

### decorators

• **decorators**: [`DecoratorApplication`](DecoratorApplication.md)[]

#### Inherited from

[DecoratedType](DecoratedType.md).[decorators](DecoratedType.md#decorators)

___

### enums

• **enums**: `Map`<`string`, [`Enum`](Enum.md)\>

___

### functionDeclarations

• **functionDeclarations**: `Map`<`string`, [`FunctionType`](FunctionType.md)\>

___

### instantiationParameters

• `Optional` **instantiationParameters**: [`Type`](../index.md#type)[]

#### Inherited from

[BaseType](BaseType.md).[instantiationParameters](BaseType.md#instantiationparameters)

___

### interfaces

• **interfaces**: `Map`<`string`, [`Interface`](Interface.md)\>

___

### kind

• **kind**: ``"Namespace"``

#### Overrides

[BaseType](BaseType.md).[kind](BaseType.md#kind)

___

### models

• **models**: `Map`<`string`, [`Model`](Model.md)\>

___

### name

• **name**: `string`

___

### namespace

• `Optional` **namespace**: [`Namespace`](Namespace.md)

___

### namespaces

• **namespaces**: `Map`<`string`, [`Namespace`](Namespace.md)\>

___

### node

• **node**: [`NamespaceStatementNode`](NamespaceStatementNode.md)

#### Overrides

[BaseType](BaseType.md).[node](BaseType.md#node)

___

### operations

• **operations**: `Map`<`string`, [`Operation`](Operation.md)\>

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

### scalars

• **scalars**: `Map`<`string`, [`Scalar`](Scalar.md)\>

___

### unions

• **unions**: `Map`<`string`, [`Union`](Union.md)\>

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
