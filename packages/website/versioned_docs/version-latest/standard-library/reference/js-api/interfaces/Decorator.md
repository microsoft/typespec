[JS Api](../index.md) / Decorator

# Interface: Decorator

## Hierarchy

- [`BaseType`](BaseType.md)

  ↳ **`Decorator`**

## Table of contents

### Properties

- [implementation](Decorator.md#implementation)
- [instantiationParameters](Decorator.md#instantiationparameters)
- [kind](Decorator.md#kind)
- [name](Decorator.md#name)
- [namespace](Decorator.md#namespace)
- [node](Decorator.md#node)
- [parameters](Decorator.md#parameters)
- [projectionBase](Decorator.md#projectionbase)
- [projectionSource](Decorator.md#projectionsource)
- [projector](Decorator.md#projector)
- [target](Decorator.md#target)

### Accessors

- [projections](Decorator.md#projections)

### Methods

- [projectionsByName](Decorator.md#projectionsbyname)

## Properties

### implementation

• **implementation**: (...`args`: `unknown`[]) => `void`

#### Type declaration

▸ (`...args`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `unknown`[] |

##### Returns

`void`

___

### instantiationParameters

• `Optional` **instantiationParameters**: [`Type`](../index.md#type)[]

#### Inherited from

[BaseType](BaseType.md).[instantiationParameters](BaseType.md#instantiationparameters)

___

### kind

• **kind**: ``"Decorator"``

#### Overrides

[BaseType](BaseType.md).[kind](BaseType.md#kind)

___

### name

• **name**: \`@${string}\`

___

### namespace

• **namespace**: [`Namespace`](Namespace.md)

___

### node

• **node**: [`DecoratorDeclarationStatementNode`](DecoratorDeclarationStatementNode.md)

#### Overrides

[BaseType](BaseType.md).[node](BaseType.md#node)

___

### parameters

• **parameters**: [`FunctionParameter`](FunctionParameter.md)[]

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

### target

• **target**: [`FunctionParameter`](FunctionParameter.md)

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
