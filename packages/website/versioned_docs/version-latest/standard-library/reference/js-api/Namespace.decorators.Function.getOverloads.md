---
jsApi: true
title: "[F] getOverloads"

---
```ts
getOverloads(program, operation): Operation[] | undefined
```

Get all operations that are marked as overloads of the given operation

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](Interface.Program.md) | Program |
| `operation` | [`Operation`](Interface.Operation.md) | Operation |

## Returns

[`Operation`](Interface.Operation.md)[] \| `undefined`

An array of operations that overload the given operation.
