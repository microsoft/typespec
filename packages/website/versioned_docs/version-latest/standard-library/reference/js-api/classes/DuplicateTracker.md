---
jsApi: true
title: "[C] DuplicateTracker"

---
Helper class to track duplicate instance

## Type Parameters

| Type Parameter |
| ------ |
| `K` |
| `V` |

## Constructors

### new DuplicateTracker()

```ts
new DuplicateTracker<K, V>(): DuplicateTracker<K, V>
```

#### Returns

[`DuplicateTracker`](DuplicateTracker.md)<`K`, `V`\>

## Methods

### entries()

```ts
entries(): Iterable<[K, V[]], any, any>
```

Return iterator of all the duplicate entries.

#### Returns

`Iterable`<[`K`, `V`[]], `any`, `any`\>

***

### track()

```ts
track(k, v): void
```

Track usage of K.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `k` | `K` | key that is being checked for duplicate. |
| `v` | `V` | value that map to the key |

#### Returns

`void`
