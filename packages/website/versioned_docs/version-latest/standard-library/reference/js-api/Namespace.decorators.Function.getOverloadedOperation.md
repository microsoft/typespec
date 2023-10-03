---
jsApi: true
title: "[F] getOverloadedOperation"

---
```ts
getOverloadedOperation(program, operation): Operation | undefined
```

If the given operation overloads another operation, return that operation.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](Interface.Program.md) | Program |
| `operation` | [`Operation`](Interface.Operation.md) | The operation to check for an overload target. |

## Returns

[`Operation`](Interface.Operation.md) \| `undefined`

The operation this operation overloads, if any.
