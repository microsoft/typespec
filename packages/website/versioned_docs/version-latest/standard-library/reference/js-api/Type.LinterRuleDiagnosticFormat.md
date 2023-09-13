---
jsApi: true
title: "[T] LinterRuleDiagnosticFormat"

---
```ts
LinterRuleDiagnosticFormat: <T, M> T[M] extends CallableMessage< infer A > ? {format: Record< A[number], string >;} : Record< string, unknown >
```

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` *extends* [`DiagnosticMessages`](Interface.DiagnosticMessages.md) | - |
| `M` *extends* *keyof* `T` | `"default"` |
