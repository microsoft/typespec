---
jsApi: true
title: "[I] Decorator"

---
## Extends

- [`BaseType`](BaseType.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| ------ | ------ | ------ | ------ | ------ | ------ |
| `entityKind` | `readonly` | `"Type"` | - | - | [`BaseType`](BaseType.md).`entityKind` |
| `implementation` | `public` | (...`args`: `unknown`[]) => `void` | - | - | - |
| `instantiationParameters?` | `public` | [`Type`](../type-aliases/Type.md)[] | - | - | [`BaseType`](BaseType.md).`instantiationParameters` |
| `isFinished` | `public` | `boolean` | Reflect if a type has been finished(Decorators have been called). There is multiple reasons a type might not be finished: - a template declaration will not - a template instance that argument that are still template parameters - a template instance that is only partially instantiated(like a templated operation inside a templated interface) | - | [`BaseType`](BaseType.md).`isFinished` |
| `kind` | `public` | `"Decorator"` | - | [`BaseType`](BaseType.md).`kind` | - |
| `name` | `public` | \`@$\{string\}\` | - | - | - |
| `namespace` | `public` | [`Namespace`](Namespace.md) | - | - | - |
| `node` | `public` | [`DecoratorDeclarationStatementNode`](DecoratorDeclarationStatementNode.md) | - | [`BaseType`](BaseType.md).`node` | - |
| `parameters` | `public` | [`MixedFunctionParameter`](MixedFunctionParameter.md)[] | - | - | - |
| `projectionBase?` | `public` | [`Type`](../type-aliases/Type.md) | - | - | [`BaseType`](BaseType.md).`projectionBase` |
| `projectionSource?` | `public` | [`Type`](../type-aliases/Type.md) | - | - | [`BaseType`](BaseType.md).`projectionSource` |
| `projector?` | `public` | [`Projector`](Projector.md) | - | - | [`BaseType`](BaseType.md).`projector` |
| `target` | `public` | [`MixedFunctionParameter`](MixedFunctionParameter.md) | - | - | - |

## Accessors

### projections

```ts
get projections(): ProjectionStatementNode[]
```

#### Returns

[`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Inherited from

[`BaseType`](BaseType.md).[`projections`](BaseType.md#projections)

## Methods

### projectionsByName()

```ts
projectionsByName(name): ProjectionStatementNode[]
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

[`ProjectionStatementNode`](ProjectionStatementNode.md)[]

#### Inherited from

[`BaseType`](BaseType.md).[`projectionsByName`](BaseType.md#projectionsbyname)
