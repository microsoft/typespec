---
jsApi: true
title: "[F] getErrorsDocData"

---
```ts
getErrorsDocData(program, target): DocData | undefined
```

Get the documentation information for the return errors types of an operation. In most cases you probably just want to use [getErrorsDoc](getErrorsDoc.md)

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `target` | [`Operation`](../interfaces/Operation.md) | Type |

## Returns

Doc data with source information.
