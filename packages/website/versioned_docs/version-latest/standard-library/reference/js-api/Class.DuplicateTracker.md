---
jsApi: true
title: "[C] DuplicateTracker"

---
Helper class to track duplicate instance

## Constructors

### new DuplicateTracker

```ts
new DuplicateTracker<K, V>(): DuplicateTracker< K, V >
```

#### Type parameters

| Parameter |
| :------ |
| `K` |
| `V` |

#### Returns

[`DuplicateTracker`](Class.DuplicateTracker.md)< `K`, `V` \>

## Properties

| Property | Type |
| :------ | :------ |
| `private` `#entries` | `Map`< `K`, `V`[] \> |

## Methods

### entries

```ts
entries(): Iterable< [K, V[]] >
```

Return iterator of all the duplicate entries.

#### Returns

`Iterable`< [`K`, `V`[]] \>

***

### track

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
