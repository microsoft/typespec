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
| `decorators` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | [`DecoratedType.decorators`](DecoratedType.md) |
| `enums` | `Map`<`string`, [`Enum`](Enum.md)\> | The enums in the namespace.<br /><br />Order is implementation-defined and may change. | - |
| `functionDeclarations` | `Map`<`string`, [`FunctionType`](FunctionType.md)\> | The functions declared in the namespace.<br /><br />Order is implementation-defined and may change. | - |
| `instantiationParameters?` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType.instantiationParameters`](BaseType.md) |
| `interfaces` | `Map`<`string`, [`Interface`](Interface.md)\> | The interfaces in the namespace.<br /><br />Order is implementation-defined and may change. | - |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) | [`BaseType.isFinished`](BaseType.md) |
| `kind` | `"Namespace"` | - | [`BaseType.kind`](BaseType.md) |
| `models` | `Map`<`string`, [`Model`](Model.md)\> | The models in the namespace.<br /><br />Order is implementation-defined and may change. | - |
| `name` | `string` | - | - |
| `namespace?` | [`Namespace`](Namespace.md) | - | - |
| `namespaces` | `Map`<`string`, [`Namespace`](Namespace.md)\> | The sub-namespaces in the namespace.<br /><br />Order is implementation-defined and may change. | - |
| `node` | [`JsNamespaceDeclarationNode`](JsNamespaceDeclarationNode.md) \| [`NamespaceStatementNode`](NamespaceStatementNode.md) | - | [`BaseType.node`](BaseType.md) |
| `operations` | `Map`<`string`, [`Operation`](Operation.md)\> | The operations in the namespace.<br /><br />Order is implementation-defined and may change. | - |
| `projectionBase?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType.projectionBase`](BaseType.md) |
| `projectionSource?` | [`Type`](../type-aliases/Type.md) | - | [`BaseType.projectionSource`](BaseType.md) |
| `projector?` | [`Projector`](Projector.md) | - | [`BaseType.projector`](BaseType.md) |
| `scalars` | `Map`<`string`, [`Scalar`](Scalar.md)\> | The scalars in the namespace.<br /><br />Order is implementation-defined and may change. | - |
| `unions` | `Map`<`string`, [`Union`](Union.md)\> | The unions in the namespace.<br /><br />Order is implementation-defined and may change. | - |

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
