---
jsApi: true
title: "[F] navigateProgram"

---
```ts
navigateProgram(
  program,
  listeners,
  options = {}): void
```

Navigate all types in the program.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](Interface.Program.md) | Program to navigate. |
| `listeners` | [`SemanticNodeListener`](Type.SemanticNodeListener.md) | Listener called when visiting types. |
| `options` | [`NavigationOptions`](Interface.NavigationOptions.md) | Navigation options. |

## Returns

`void`
