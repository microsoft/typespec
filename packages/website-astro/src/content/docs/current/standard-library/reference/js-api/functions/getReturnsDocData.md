---
jsApi: true
title: "[F] getReturnsDocData"

---
```ts
getReturnsDocData(program, target): DocData | undefined
```

Get the documentation information for the return success types of an operation. In most cases you probably just want to use [getReturnsDoc](getReturnsDoc.md)

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `target` | [`Operation`](../interfaces/Operation.md) | Type |

## Returns

Doc data with source information.
