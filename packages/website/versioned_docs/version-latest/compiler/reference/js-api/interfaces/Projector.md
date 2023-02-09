[JS Api](../index.md) / Projector

# Interface: Projector

## Table of contents

### Properties

- [parentProjector](Projector.md#parentprojector)
- [projectedGlobalNamespace](Projector.md#projectedglobalnamespace)
- [projectedStartNode](Projector.md#projectedstartnode)
- [projectedTypes](Projector.md#projectedtypes)
- [projections](Projector.md#projections)

### Methods

- [projectType](Projector.md#projecttype)

## Properties

### parentProjector

• `Optional` **parentProjector**: [`Projector`](Projector.md)

___

### projectedGlobalNamespace

• `Optional` **projectedGlobalNamespace**: [`Namespace`](Namespace.md)

___

### projectedStartNode

• `Optional` **projectedStartNode**: [`Type`](../index.md#type)

___

### projectedTypes

• **projectedTypes**: `Map`<[`Type`](../index.md#type), [`Type`](../index.md#type)\>

___

### projections

• **projections**: [`ProjectionApplication`](ProjectionApplication.md)[]

## Methods

### projectType

▸ **projectType**(`type`): [`Type`](../index.md#type)

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | [`Type`](../index.md#type) |

#### Returns

[`Type`](../index.md#type)
