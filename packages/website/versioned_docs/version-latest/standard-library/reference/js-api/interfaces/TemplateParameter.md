[JS Api](../index.md) / TemplateParameter

# Interface: TemplateParameter

## Hierarchy

- [`BaseType`](BaseType.md)

  ↳ **`TemplateParameter`**

## Table of contents

### Properties

- [constraint](TemplateParameter.md#constraint)
- [default](TemplateParameter.md#default)
- [instantiationParameters](TemplateParameter.md#instantiationparameters)
- [kind](TemplateParameter.md#kind)
- [node](TemplateParameter.md#node)
- [projectionBase](TemplateParameter.md#projectionbase)
- [projectionSource](TemplateParameter.md#projectionsource)
- [projector](TemplateParameter.md#projector)

### Accessors

- [projections](TemplateParameter.md#projections)

### Methods

- [projectionsByName](TemplateParameter.md#projectionsbyname)

## Properties

### constraint

• `Optional` **constraint**: [`Type`](../index.md#type)

___

### default

• `Optional` **default**: [`Type`](../index.md#type)

___

### instantiationParameters

• `Optional` **instantiationParameters**: [`Type`](../index.md#type)[]

#### Inherited from

[BaseType](BaseType.md).[instantiationParameters](BaseType.md#instantiationparameters)

___

### kind

• **kind**: ``"TemplateParameter"``

#### Overrides

[BaseType](BaseType.md).[kind](BaseType.md#kind)

___

### node

• **node**: [`TemplateParameterDeclarationNode`](TemplateParameterDeclarationNode.md)

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
