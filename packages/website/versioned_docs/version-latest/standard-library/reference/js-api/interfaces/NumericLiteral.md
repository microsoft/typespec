[JS Api](../index.md) / NumericLiteral

# Interface: NumericLiteral

## Hierarchy

- [`BaseType`](BaseType.md)

  ↳ **`NumericLiteral`**

## Table of contents

### Properties

- [instantiationParameters](NumericLiteral.md#instantiationparameters)
- [isFinished](NumericLiteral.md#isfinished)
- [kind](NumericLiteral.md#kind)
- [node](NumericLiteral.md#node)
- [projectionBase](NumericLiteral.md#projectionbase)
- [projectionSource](NumericLiteral.md#projectionsource)
- [projector](NumericLiteral.md#projector)
- [value](NumericLiteral.md#value)
- [valueAsString](NumericLiteral.md#valueasstring)

### Accessors

- [projections](NumericLiteral.md#projections)

### Methods

- [projectionsByName](NumericLiteral.md#projectionsbyname)

## Properties

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

• **kind**: ``"Number"``

#### Overrides

[BaseType](BaseType.md).[kind](BaseType.md#kind)

___

### node

• `Optional` **node**: [`NumericLiteralNode`](NumericLiteralNode.md)

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

### value

• **value**: `number`

___

### valueAsString

• **valueAsString**: `string`

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
