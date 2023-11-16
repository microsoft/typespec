---
jsApi: true
title: "[C] Queue"

---
## Type parameters

| Parameter |
| :------ |
| `T` |

## Constructors

### new Queue(elements)

```ts
new Queue<T>(elements?): Queue<T>
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `elements`? | `T`[] |

#### Returns

[`Queue`](Queue.md)<`T`\>

## Properties

| Modifier | Property | Type | Description |
| :------ | :------ | :------ | :------ |
| `private` | `#elements` | `T`[] | - |
| `private` | `#headIndex` | `number` | - |

## Methods

### dequeue()

```ts
dequeue(): T
```

#### Returns

`T`

***

### enqueue()

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

### isEmpty()

```ts
isEmpty(): boolean
```

#### Returns

`boolean`
