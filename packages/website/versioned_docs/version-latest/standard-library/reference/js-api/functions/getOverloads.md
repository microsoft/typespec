---
jsApi: true
title: "[F] getOverloads"

---
```ts
function getOverloads(program, operation): Operation[] | undefined
```

Get all operations that are marked as overloads of the given operation

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program |
| `operation` | [`Operation`](../interfaces/Operation.md) | Operation |

## Returns

[`Operation`](../interfaces/Operation.md)[] \| `undefined`

An array of operations that overload the given operation.
