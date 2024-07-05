---
jsApi: true
title: "[F] getAuthenticationForOperation"

---
```ts
function getAuthenticationForOperation(program, operation): Authentication | undefined
```

Resolve the authentication for a given operation.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | Program |
| `operation` | `Operation` | Operation |

## Returns

[`Authentication`](../interfaces/Authentication.md) \| `undefined`

Authentication provided on the operation or containing interface or namespace.
