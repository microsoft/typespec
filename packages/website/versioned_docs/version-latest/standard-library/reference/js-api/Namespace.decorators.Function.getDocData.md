---
jsApi: true
title: "[F] getDocData"

---
```ts
getDocData(program, target): DocData | undefined
```

Get the documentation information for the given type. In most cases you probably just want to use [getDoc](Namespace.decorators.Function.getDoc.md)

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](Interface.Program.md) | Program |
| `target` | [`Type`](Type.Type.md) | Type |

## Returns

[`DocData`](Namespace.decorators.Interface.DocData.md) \| `undefined`

Doc data with source information.
