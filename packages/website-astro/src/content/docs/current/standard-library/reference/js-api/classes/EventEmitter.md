---
jsApi: true
title: "[C] EventEmitter"

---
## Type parameters

| Parameter |
| :------ |
| `T` extends `object` |

## Constructors

### new EventEmitter()

```ts
new EventEmitter<T>(): EventEmitter<T>
```

## Properties

| Modifier | Property | Type | Description |
| :------ | :------ | :------ | :------ |
| `private` | `listeners` | `Map`<keyof `T`, (...`args`) => `any`[]\> | - |

## Methods

### emit()

```ts
emit<K>(name, ...args): void
```

#### Type parameters

| Parameter |
| :------ |
| `K` extends `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `K` |
| ...`args` | `Parameters`<`T`[`K`]\> |

***

### on()

```ts
on<K>(name, listener): void
```

#### Type parameters

| Parameter |
| :------ |
| `K` extends `string` \| `number` \| `symbol` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `name` | `K` |
| `listener` | (...`args`) => `any` |
