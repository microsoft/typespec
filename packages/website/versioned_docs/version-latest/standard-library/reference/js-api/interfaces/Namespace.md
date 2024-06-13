---
jsApi: true
title: "[I] Namespace"

---
## Extends

- [`BaseType`](BaseType.md).[`DecoratedType`](DecoratedType.md)

## Properties

| Property | Modifier | Type | Description | Overrides | Inherited from |
| :------ | :------ | :------ | :------ | :------ | :------ |
| `decoratorDeclarations` | `public` | `Map`<`string`, [`Decorator`](Decorator.md)\> | <p>The decorators declared in the namespace.</p><p>Order is implementation-defined and may change.</p> | - | - |
| `decorators` | `public` | [`DecoratorApplication`](DecoratorApplication.md)[] | - | [`DecoratedType`](DecoratedType.md).`decorators` | [`DecoratedType`](DecoratedType.md).`decorators` |
| `entityKind` | `readonly` | `"Type"` | - | [`BaseType`](BaseType.md).`entityKind` | [`BaseType`](BaseType.md).`entityKind` |
| `enums` | `public` | `Map`<`string`, [`Enum`](Enum.md)\> | <p>The enums in the namespace.</p><p>Order is implementation-defined and may change.</p> | - | - |
| `functionDeclarations` | `public` | `Map`<`string`, [`FunctionType`](FunctionType.md)\> | <p>The functions declared in the namespace.</p><p>Order is implementation-defined and may change.</p> | - | - |
| `instantiationParameters?` | `public` | [`Type`](../type-aliases/Type.md)[] | - | [`BaseType`](BaseType.md).`instantiationParameters` | [`BaseType`](BaseType.md).`instantiationParameters` |
| `interfaces` | `public` | `Map`<`string`, [`Interface`](Interface.md)\> | <p>The interfaces in the namespace.</p><p>Order is implementation-defined and may change.</p> | - | - |
| `isFinished` | `public` | `boolean` | <p>Reflect if a type has been finished(Decorators have been called). There is multiple reasons a type might not be finished:</p><ul><li>a template declaration will not</li><li>a template instance that argument that are still template parameters</li><li>a template instance that is only partially instantiated(like a templated operation inside a templated interface)</li></ul> | [`BaseType`](BaseType.md).`isFinished` | [`BaseType`](BaseType.md).`isFinished` |
| `kind` | `public` | `"Namespace"` | - | [`BaseType`](BaseType.md).`kind` | [`BaseType`](BaseType.md).`kind` |
| `models` | `public` | `Map`<`string`, [`Model`](Model.md)\> | <p>The models in the namespace.</p><p>Order is implementation-defined and may change.</p> | - | - |
| `name` | `public` | `string` | - | - | - |
| `namespace?` | `public` | [`Namespace`](Namespace.md) | - | - | - |
| `namespaces` | `public` | `Map`<`string`, [`Namespace`](Namespace.md)\> | <p>The sub-namespaces in the namespace.</p><p>Order is implementation-defined and may change.</p> | - | - |
| `node` | `public` | [`JsNamespaceDeclarationNode`](JsNamespaceDeclarationNode.md) \| [`NamespaceStatementNode`](NamespaceStatementNode.md) | - | [`BaseType`](BaseType.md).`node` | [`BaseType`](BaseType.md).`node` |
| `operations` | `public` | `Map`<`string`, [`Operation`](Operation.md)\> | <p>The operations in the namespace.</p><p>Order is implementation-defined and may change.</p> | - | - |
| `projectionBase?` | `public` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionBase` | [`BaseType`](BaseType.md).`projectionBase` |
| `projectionSource?` | `public` | [`Type`](../type-aliases/Type.md) | - | [`BaseType`](BaseType.md).`projectionSource` | [`BaseType`](BaseType.md).`projectionSource` |
| `projector?` | `public` | [`Projector`](Projector.md) | - | [`BaseType`](BaseType.md).`projector` | [`BaseType`](BaseType.md).`projector` |
| `scalars` | `public` | `Map`<`string`, [`Scalar`](Scalar.md)\> | <p>The scalars in the namespace.</p><p>Order is implementation-defined and may change.</p> | - | - |
| `unions` | `public` | `Map`<`string`, [`Union`](Union.md)\> | <p>The unions in the namespace.</p><p>Order is implementation-defined and may change.</p> | - | - |

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

[`BaseType`](BaseType.md).[`projectionsByName`](BaseType.md#projectionsbyname)
