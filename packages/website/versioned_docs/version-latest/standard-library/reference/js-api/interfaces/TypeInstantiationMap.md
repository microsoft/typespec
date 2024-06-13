---
jsApi: true
title: "[I] TypeInstantiationMap"

---
Maps type arguments to instantiated type.

## Methods

### get()

```ts
get(args): undefined | Type
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `args` | readonly ([`Type`](../type-aliases/Type.md) \| [`Value`](../type-aliases/Value.md) \| [`IndeterminateEntity`](IndeterminateEntity.md))[] |

#### Returns

`undefined` \| [`Type`](../type-aliases/Type.md)

***

### set()

```ts
set(args, type): void
```

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `args` | readonly ([`Type`](../type-aliases/Type.md) \| [`Value`](../type-aliases/Value.md) \| [`IndeterminateEntity`](IndeterminateEntity.md))[] |
| `type` | [`Type`](../type-aliases/Type.md) |

#### Returns

`void`
