---
jsApi: true
title: "[F] getDocDataInternal"

---
```ts
getDocDataInternal(
   program, 
   target, 
   key): DocData | undefined
```

Get the documentation information for the given type. In most cases you probably just want to use [getDoc](getDoc.md)

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `target` | [`Type`](../type-aliases/Type.md) | Type |
| `key` | `DocTarget` | - |

## Returns

Doc data with source information.
