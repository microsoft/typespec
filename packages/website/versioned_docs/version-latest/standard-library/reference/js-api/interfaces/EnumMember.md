[JS Api](../index.md) / EnumMember

# Interface: EnumMember

## Hierarchy

- [`BaseType`](BaseType.md)

- [`DecoratedType`](DecoratedType.md)

  ↳ **`EnumMember`**

## Table of contents

### Properties

- [decorators](EnumMember.md#decorators)
- [enum](EnumMember.md#enum)
- [instantiationParameters](EnumMember.md#instantiationparameters)
- [kind](EnumMember.md#kind)
- [name](EnumMember.md#name)
- [node](EnumMember.md#node)
- [projectionBase](EnumMember.md#projectionbase)
- [projectionSource](EnumMember.md#projectionsource)
- [projector](EnumMember.md#projector)
- [sourceMember](EnumMember.md#sourcemember)
- [value](EnumMember.md#value)

### Accessors

- [projections](EnumMember.md#projections)

### Methods

- [projectionsByName](EnumMember.md#projectionsbyname)

## Properties

### decorators

• **decorators**: [`DecoratorApplication`](DecoratorApplication.md)[]

#### Inherited from

[DecoratedType](DecoratedType.md).[decorators](DecoratedType.md#decorators)

___

### enum

• **enum**: [`Enum`](Enum.md)

___

### instantiationParameters

• `Optional` **instantiationParameters**: [`Type`](../index.md#type)[]

#### Inherited from

[BaseType](BaseType.md).[instantiationParameters](BaseType.md#instantiationparameters)

___

### kind

• **kind**: ``"EnumMember"``

#### Overrides

[BaseType](BaseType.md).[kind](BaseType.md#kind)

___

### name

• **name**: `string`

___

### node

• **node**: [`EnumMemberNode`](EnumMemberNode.md)

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

### sourceMember

• `Optional` **sourceMember**: [`EnumMember`](EnumMember.md)

when spread operators make new enum members,
this tracks the enum member we copied from.

___

### value

• `Optional` **value**: `string` \| `number`

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
