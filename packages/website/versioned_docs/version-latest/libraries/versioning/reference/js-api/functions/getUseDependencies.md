---
jsApi: true
title: "[F] getUseDependencies"

---
```ts
getUseDependencies(
   program, 
   target, 
   searchEnum): Map<Namespace, Map<Version, Version> | Version> | undefined
```

## Parameters

| Parameter | Type | Default value |
| :------ | :------ | :------ |
| `program` | `Program` | `undefined` |
| `target` | `Enum` \| `Namespace` | `undefined` |
| `searchEnum` | `boolean` | `true` |

## Returns

`Map`<`Namespace`, `Map`<[`Version`](../interfaces/Version.md), [`Version`](../interfaces/Version.md)\> \| [`Version`](../interfaces/Version.md)\> \| `undefined`
