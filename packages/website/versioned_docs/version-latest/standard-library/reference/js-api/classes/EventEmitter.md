---
jsApi: true
title: "[C] EventEmitter"

---
## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* `object` |

## Constructors

### new EventEmitter()

```ts
new EventEmitter<T>(): EventEmitter<T>
```

#### Returns

[`EventEmitter`](EventEmitter.md)<`T`\>

## Methods

### emit()

```ts
emit<K>(name, ...args): void
```

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `K` |
| ...`args` | `Parameters`<`T`\[`K`\]\> |

#### Returns

`void`

***

### on()

```ts
on<K>(name, listener): void
```

#### Type Parameters

| Type Parameter |
| ------ |
| `K` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `K` |
| `listener` | (...`args`) => `any` |

#### Returns

`void`
