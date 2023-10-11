---
jsApi: true
title: "[T] DiagnosticResult"

---
```ts
type DiagnosticResult<T>: [T, readonly Diagnostic[]];
```

Return type of accessor functions in TypeSpec.
Tuple composed of:
- 0: Actual result of an accessor function
- 1: List of diagnostics that were emitted while retrieving the data.

## Type parameters

| Parameter |
| :------ |
| `T` |
