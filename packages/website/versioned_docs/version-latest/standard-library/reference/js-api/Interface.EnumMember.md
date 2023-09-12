---
jsApi: true
title: "[I] EnumMember"

---
## Extends

- [`BaseType`](Interface.BaseType.md).[`DecoratedType`](Interface.DecoratedType.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `decorators` | [`DecoratorApplication`](Interface.DecoratorApplication.md)[] | - |
| `enum` | [`Enum`](Interface.Enum.md) | - |
| `instantiationParameters`? | [`Type`](Type.Type.md)[] | - |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) |
| `kind` | `"EnumMember"` | - |
| `name` | `string` | - |
| `node` | [`EnumMemberNode`](Interface.EnumMemberNode.md) | - |
| `projectionBase`? | [`Type`](Type.Type.md) | - |
| `projectionSource`? | [`Type`](Type.Type.md) | - |
| `projector`? | [`Projector`](Interface.Projector.md) | - |
| `sourceMember`? | [`EnumMember`](Interface.EnumMember.md) | when spread operators make new enum members,<br />this tracks the enum member we copied from. |
| `value`? | `string` \| `number` | - |

## Accessors

### projections

```ts
get projections(): ProjectionStatementNode[]
```

#### Inherited from

[`BaseType`](Interface.BaseType.md).[`projections`](Interface.BaseType.md#projections)

## Methods

### projectionsByName

```ts
projectionsByName(name): ProjectionStatementNode[]
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

[`ProjectionStatementNode`](Interface.ProjectionStatementNode.md)[]

#### Inherited from

[`BaseType`](Interface.BaseType.md).[`projectionsByName`](Interface.BaseType.md#projectionsbyname)
