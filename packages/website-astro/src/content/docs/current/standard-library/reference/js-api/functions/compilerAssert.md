---
jsApi: true
title: "[F] compilerAssert"

---
```ts
compilerAssert(
   condition, 
   message, 
   target?): asserts condition
```

Use this to report bugs in the compiler, and not errors in the source code
being compiled.

## Parameters

| Parameter | Type | Description |
| :------ | :------ | :------ |
| `condition` | `any` | Throw if this is not true. |
| `message` | `string` | Error message. |
| `target`? | [`DiagnosticTarget`](../type-aliases/DiagnosticTarget.md) | Optional location in source code that might give a clue about<br />              what got the compiler off track. |
