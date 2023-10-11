---
jsApi: true
title: "[F] navigateProgram"

---
```ts
navigateProgram(
   program, 
   listeners, 
   options): void
```

Navigate all types in the program.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `program` | [`Program`](../interfaces/Program.md) | Program to navigate. |
| `listeners` | [`SemanticNodeListener`](../type-aliases/SemanticNodeListener.md) | Listener called when visiting types. |
| `options` | [`NavigationOptions`](../interfaces/NavigationOptions.md) | Navigation options. |
