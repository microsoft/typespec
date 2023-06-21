[JS Api](../index.md) / FunctionType

# Interface: FunctionType

## Hierarchy

- [`BaseType`](BaseType.md)

  ↳ **`FunctionType`**

## Table of contents

### Properties

- [implementation](FunctionType.md#implementation)
- [instantiationParameters](FunctionType.md#instantiationparameters)
- [isFinished](FunctionType.md#isfinished)
- [kind](FunctionType.md#kind)
- [name](FunctionType.md#name)
- [namespace](FunctionType.md#namespace)
- [node](FunctionType.md#node)
- [parameters](FunctionType.md#parameters)
- [projectionBase](FunctionType.md#projectionbase)
- [projectionSource](FunctionType.md#projectionsource)
- [projector](FunctionType.md#projector)
- [returnType](FunctionType.md#returntype)

### Accessors

- [projections](FunctionType.md#projections)

### Methods

- [projectionsByName](FunctionType.md#projectionsbyname)

## Properties

### implementation

• **implementation**: (...`args`: `unknown`[]) => `unknown`

#### Type declaration

▸ (`...args`): `unknown`

##### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `unknown`[] |

##### Returns

`unknown`

___

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

• **kind**: ``"Function"``

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

• `Optional` **node**: [`FunctionDeclarationStatementNode`](FunctionDeclarationStatementNode.md)

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

### returnType

• **returnType**: [`Type`](../index.md#type)

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
