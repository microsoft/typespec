---
jsApi: true
title: "[F] resolveRequestVisibility"

---
```ts
resolveRequestVisibility(
   program, 
   operation, 
   verb): Visibility
```

Returns the applicable parameter visibility or visibilities for the request if `@requestVisibility` was used.
Otherwise, returns the default visibility based on the HTTP verb for the operation.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | `Program` | - |
| `operation` | `Operation` | The TypeSpec Operation for the request. |
| `verb` | [`HttpVerb`](../type-aliases/HttpVerb.md) | The HTTP verb for the operation. |

## Returns

The applicable parameter visibility or visibilities for the request.
