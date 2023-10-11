---
jsApi: true
title: "[C] DuplicateTracker"

---
Helper class to track duplicate instance

## Type parameters

| Parameter |
| :------ |
| `K` |
| `V` |

## Constructors

### new DuplicateTracker()

```ts
new DuplicateTracker<K, V>(): DuplicateTracker<K, V>
```

## Properties

| Modifier | Property | Type | Description |
| :------ | :------ | :------ | :------ |
| `private` | `#entries` | `Map`<`K`, `V`[]\> | - |

## Methods

### entries()

```ts
entries(): Iterable<[K, V[]]>
```

Return iterator of all the duplicate entries.

***

### track()

```ts
track(k, v): void
```

Track usage of K.

#### Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `k` | `K` | key that is being checked for duplicate. |
| `v` | `V` | value that map to the key |
