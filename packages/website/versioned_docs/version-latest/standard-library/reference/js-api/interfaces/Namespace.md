---
jsApi: true
title: "[I] Namespace"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| ------ | ------ | ------ | ------ | ------ | ------ |
| `decoratorDeclarations` | `public` | `Map`<`string`, [`Decorator`](Decorator.md)\> | The decorators declared in the namespace. Order is implementation-defined and may change. | - | - |
| `decorators` | `public` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | - | [`DecoratedType`](DecoratedType.md).`decorators` |
| `entityKind` | `readonly` | `"Type"` | - | - | [`BaseType`](BaseType.md).`entityKind` |
| `enums` | `public` | `Map`<`string`, [`Enum`](Enum.md)\> | The enums in the namespace. Order is implementation-defined and may change. | - | - |
| `functionDeclarations` | `public` | `Map`<`string`, [`FunctionType`](FunctionType.md)\> | The functions declared in the namespace. Order is implementation-defined and may change. | - | - |
| `instantiationParameters?` | `public` | [`Type`](../type-aliases/Type.md)[] | - | - | [`BaseType`](BaseType.md).`instantiationParameters` |
| `interfaces` | `public` | `Map`<`string`, [`Interface`](Interface.md)\> | The interfaces in the namespace. Order is implementation-defined and may change. | - | - |
| `isFinished` | `public` | `boolean` | Reflect if a type has been finished(Decorators have been called). There is multiple reasons a type might not be finished: - a template declaration will not - a template instance that argument that are still template parameters - a template instance that is only partially instantiated(like a templated operation inside a templated interface) | - | [`BaseType`](BaseType.md).`isFinished` |
| `kind` | `public` | `"Namespace"` | - | [`BaseType`](BaseType.md).`kind` | - |
| `models` | `public` | `Map`<`string`, [`Model`](Model.md)\> | The models in the namespace. Order is implementation-defined and may change. | - | - |
| `name` | `public` | `string` | - | - | - |
| `namespace?` | `public` | [`Namespace`](Namespace.md) | - | - | - |
| `namespaces` | `public` | `Map`<`string`, [`Namespace`](Namespace.md)\> | The sub-namespaces in the namespace. Order is implementation-defined and may change. | - | - |
| `node` | `public` | [`JsNamespaceDeclarationNode`](JsNamespaceDeclarationNode.md) \| [`NamespaceStatementNode`](NamespaceStatementNode.md) | - | [`BaseType`](BaseType.md).`node` | - |
| `operations` | `public` | `Map`<`string`, [`Operation`](Operation.md)\> | The operations in the namespace. Order is implementation-defined and may change. | - | - |
| `projectionBase?` | `public` | [`Type`](../type-aliases/Type.md) | - | - | [`BaseType`](BaseType.md).`projectionBase` |
| `projectionSource?` | `public` | [`Type`](../type-aliases/Type.md) | - | - | [`BaseType`](BaseType.md).`projectionSource` |
| `projector?` | `public` | [`Projector`](Projector.md) | - | - | [`BaseType`](BaseType.md).`projector` |
| `scalars` | `public` | `Map`<`string`, [`Scalar`](Scalar.md)\> | The scalars in the namespace. Order is implementation-defined and may change. | - | - |
| `unions` | `public` | `Map`<`string`, [`Union`](Union.md)\> | The unions in the namespace. Order is implementation-defined and may change. | - | - |

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
