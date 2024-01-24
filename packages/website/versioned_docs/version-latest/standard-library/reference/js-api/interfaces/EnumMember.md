---
jsApi: true
title: "[I] EnumMember"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md)

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `decorators` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | [`DecoratedType.decorators`](DecoratedType.md) |
| `enum` | [`Enum`](Enum.md) | - | - |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType.instantiationParameters`](BaseType.md) |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`BaseType.isFinished`](BaseType.md) |
| `kind` | `"EnumMember"` | - | [`BaseType.kind`](BaseType.md) |
| `name` | `string` | - | - |
| `node` | [`EnumMemberNode`](EnumMemberNode.md) | - | [`BaseType.node`](BaseType.md) |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType.projectionBase`](BaseType.md) |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType.projectionSource`](BaseType.md) |
| `projector?` | [`Projector`](Projector.md) | - | [`BaseType.projector`](BaseType.md) |
| `sourceMember?` | [`EnumMember`](EnumMember.md) | when spread operators make new enum members,<br />this tracks the enum member we copied from. | - |
| `value?` | `string` \| `number` | - | - |

## Accessors

### projections

```ts
get projections(): ProjectionStatementNode[]
```

#### Returns

[`ProjectionStatementNode`](ProjectionStatementNode.md)[]

## Methods

### projectionsByName()

```ts
projectionsByName(name): ProjectionStatementNode[]
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

[`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Inherited from

[`BaseType.projectionsByName`](BaseType.md#projectionsbyname)
