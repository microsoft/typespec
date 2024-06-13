---
jsApi: true
title: "[C] DuplicateTracker"

---
Helper class to track duplicate instance

## Type parameters

| Type parameter |
| :------ |
| `K` |
| `V` |

## Constructors

### new DuplicateTracker()

```ts
new DuplicateTracker<K, V>(): DuplicateTracker<K, V>
```

#### Returns

[`DuplicateTracker`](DuplicateTracker.md)<`K`, `V`\>

## Properties

| Property | Modifier | Type | Default value |
| :------ | :------ | :------ | :------ |
| `#entries` | `private` | `Map`<`K`, `V`[]\> | `...` |

## Methods

### entries()

```ts
entries(): Iterable<[K, V[]]>
```

Return iterator of all the duplicate entries.

#### Returns

`Iterable`<[`K`, `V`[]]\>

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

#### Returns

`void`
