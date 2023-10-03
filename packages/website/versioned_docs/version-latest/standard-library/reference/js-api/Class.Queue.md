---
jsApi: true
title: "[C] Queue"

---
## Constructors

### new Queue

```ts
new Queue<T>(elements?): Queue< T >
```

#### Type parameters

| Parameter |
| :------ |
| `T` |

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `elements`? | `T`[] |

#### Returns

[`Queue`](Class.Queue.md)< `T` \>

## Properties

| Property | Type |
| :------ | :------ |
| `private` `#elements` | `T`[] |
| `private` `#headIndex` | `number` |

## Methods

### dequeue

```ts
dequeue(): T
```

#### Returns

`T`

***

### enqueue

```ts
enqueue(...items): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| ...`items` | `T`[] |

#### Returns

`void`

***

### isEmpty

```ts
isEmpty(): boolean
```

#### Returns

`boolean`
