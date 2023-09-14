---
jsApi: true
title: "[I] Namespace"

---
## Extends

- [`BaseType`](Interface.BaseType.md).[`DecoratedType`](Interface.DecoratedType.md)

## Properties

| Property | Type | Description |
| :------ | :------ | :------ |
| `decoratorDeclarations` | `Map`< `string`, [`Decorator`](Interface.Decorator.md) \> | The decorators declared in the namespace.<br /><br />Order is implementation-defined and may change. |
| `decorators` | [`DecoratorApplication`](Interface.DecoratorApplication.md)[] | - |
| `enums` | `Map`< `string`, [`Enum`](Interface.Enum.md) \> | The enums in the namespace.<br /><br />Order is implementation-defined and may change. |
| `functionDeclarations` | `Map`< `string`, [`FunctionType`](Interface.FunctionType.md) \> | The functions declared in the namespace.<br /><br />Order is implementation-defined and may change. |
| `instantiationParameters`? | [`Type`](Type.Type.md)[] | - |
| `interfaces` | `Map`< `string`, [`Interface`](Interface.Interface.md) \> | The interfaces in the namespace.<br /><br />Order is implementation-defined and may change. |
| `isFinished` | `boolean` | Reflect if a type has been finished(Decorators have been called).<br />There is multiple reasons a type might not be finished:<br />- a template declaration will not<br />- a template instance that argument that are still template parameters<br />- a template instance that is only partially instantiated(like a templated operation inside a templated interface) |
| `kind` | `"Namespace"` | - |
| `models` | `Map`< `string`, [`Model`](Interface.Model.md) \> | The models in the namespace.<br /><br />Order is implementation-defined and may change. |
| `name` | `string` | - |
| `namespace`? | [`Namespace`](Interface.Namespace.md) | - |
| `namespaces` | `Map`< `string`, [`Namespace`](Interface.Namespace.md) \> | The sub-namespaces in the namespace.<br /><br />Order is implementation-defined and may change. |
| `node` | [`JsNamespaceDeclarationNode`](Interface.JsNamespaceDeclarationNode.md) \| [`NamespaceStatementNode`](Interface.NamespaceStatementNode.md) | - |
| `operations` | `Map`< `string`, [`Operation`](Interface.Operation.md) \> | The operations in the namespace.<br /><br />Order is implementation-defined and may change. |
| `projectionBase`? | [`Type`](Type.Type.md) | - |
| `projectionSource`? | [`Type`](Type.Type.md) | - |
| `projector`? | [`Projector`](Interface.Projector.md) | - |
| `scalars` | `Map`< `string`, [`Scalar`](Interface.Scalar.md) \> | The scalars in the namespace.<br /><br />Order is implementation-defined and may change. |
| `unions` | `Map`< `string`, [`Union`](Interface.Union.md) \> | The unions in the namespace.<br /><br />Order is implementation-defined and may change. |

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
