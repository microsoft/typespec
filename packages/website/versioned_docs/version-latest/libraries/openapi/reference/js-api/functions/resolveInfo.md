---
jsApi: true
title: "[F] resolveInfo"

---
```ts
function resolveInfo(program, entity): AdditionalInfo | undefined
```

Resolve the info entry by merging data specified with `@service`, `@summary` and `@info`.

## Parameters

| Parameter | Type |
| :------ | :------ |
| `program` | `Program` |
| `entity` | `Namespace` |

## Returns

[`AdditionalInfo`](../interfaces/AdditionalInfo.md) \| `undefined`
