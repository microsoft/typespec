---
jsApi: true
title: "[C] EventEmitter"

---
## Type parameters

| Type parameter |
| :------ |
| `T` *extends* `object` |

## Constructors

### new EventEmitter()

```ts
new EventEmitter<T>(): EventEmitter<T>
```

#### Returns

[`EventEmitter`](EventEmitter.md)<`T`\>

## Properties

| Property | Modifier | Type | Default value |
| :------ | :------ | :------ | :------ |
| `listeners` | `private` | `Map`<keyof `T`, (...`args`) => `any`[]\> | `...` |

## Methods

### emit()

```ts
emit<K>(name, ...args): void
```

#### Type parameters

| Type parameter |
| :------ |
| `K` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `K` |
| ...`args` | `Parameters`<`T`\[`K`\]\> |

#### Returns

`void`

***

### on()

```ts
on<K>(name, listener): void
```

#### Type parameters

| Type parameter |
| :------ |
| `K` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `K` |
| `listener` | (...`args`) => `any` |

#### Returns

`void`
