---
jsApi: true
title: "[I] ProjectedNameView"

---
## Properties

| Property | Type |
| :------ | :------ |
| `program` | [`ProjectedProgram`](ProjectedProgram.md) |

## Methods

### getProjectedName()

```ts
getProjectedName(target): string
```

Get the name of the given entity in that scope.
If there is a projected name it returns that one otherwise return the original name.

#### Parameters

| Parameter | Type |
| :------ | :------ |
| `target` | [`Type`](../type-aliases/Type.md) & `object` |

#### Returns

`string`
