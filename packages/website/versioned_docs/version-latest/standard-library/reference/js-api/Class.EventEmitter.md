---
jsApi: true
title: "[C] EventEmitter"

---
## Constructors

### new EventEmitter

```ts
new EventEmitter<T>(): EventEmitter< T >
```

#### Type parameters

| Parameter |
| :------ |
| `T` *extends* \{} |

#### Returns

[`EventEmitter`](Class.EventEmitter.md)< `T` \>

## Properties

| Property | Type |
| :------ | :------ |
| `private` `listeners` | `Map`< *keyof* `T`, (...`args`) => `any`[] \> |

## Methods

### emit

```ts
emit<K>(name, ...args): void
```

#### Type parameters

| Parameter |
| :------ |
| `K` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `K` |
| ...`args` | `Parameters`< `T`[`K`] \> |

#### Returns

`void`

***

### on

```ts
on<K>(name, listener): void
```

#### Type parameters

| Parameter |
| :------ |
| `K` *extends* `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `K` |
| `listener` | (...`args`) => `any` |

#### Returns

`void`
