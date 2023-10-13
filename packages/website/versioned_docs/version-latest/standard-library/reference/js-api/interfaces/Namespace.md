---
jsApi: true
title: "[I] Namespace"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md)

## Properties

| Property | Type | Description | Inheritance |
| :------ | :------ | :------ | :------ |
| `decoratorDeclarations` | `Map`<`string`, [`Decorator`](Decorator.md)\> | The decorators declared in the namespace.<br /><br />Order is implementation-defined and may change. | - |
| `decorators` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | [`DecoratedType`](DecoratedType.md).`decorators` |
| `enums` | `Map`<`string`, [`Enum`](Enum.md)\> | The enums in the namespace.<br /><br />Order is implementation-defined and may change. | - |
| `functionDeclarations` | `Map`<`string`, [`FunctionType`](FunctionType.md)\> | The functions declared in the namespace.<br /><br />Order is implementation-defined and may change. | - |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType`](BaseType.md).`instantiationParameters` |
| `interfaces` | `Map`<`string`, [`Interface`](Interface.md)\> | The interfaces in the namespace.<br /><br />Order is implementation-defined and may change. | - |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`BaseType`](BaseType.md).`isFinished` |
| `kind` | `"Namespace"` | - | [`BaseType`](BaseType.md).`kind` |
| `models` | `Map`<`string`, [`Model`](Model.md)\> | The models in the namespace.<br /><br />Order is implementation-defined and may change. | - |
| `name` | `string` | - | - |
| `namespace?` | [`Namespace`](Namespace.md) | - | - |
| `namespaces` | `Map`<`string`, [`Namespace`](Namespace.md)\> | The sub-namespaces in the namespace.<br /><br />Order is implementation-defined and may change. | - |
| `node` | [`JsNamespaceDeclarationNode`](JsNamespaceDeclarationNode.md) \| [`NamespaceStatementNode`](NamespaceStatementNode.md) | - | [`BaseType`](BaseType.md).`node` |
| `operations` | `Map`<`string`, [`Operation`](Operation.md)\> | The operations in the namespace.<br /><br />Order is implementation-defined and may change. | - |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionBase` |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionSource` |
| `projector?` | [`Projector`](Projector.md) | - | [`BaseType`](BaseType.md).`projector` |
| `scalars` | `Map`<`string`, [`Scalar`](Scalar.md)\> | The scalars in the namespace.<br /><br />Order is implementation-defined and may change. | - |
| `unions` | `Map`<`string`, [`Union`](Union.md)\> | The unions in the namespace.<br /><br />Order is implementation-defined and may change. | - |

## Accessors

### projections

```ts
get projections(): ProjectionStatementNode[]
```

## Methods

### projectionsByName()

```ts
projectionsByName(name): ProjectionStatementNode[]
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `string` |

#### Inherited from

[`BaseType`](BaseType.md).[`projectionsByName`](BaseType.md#projectionsbyname)
