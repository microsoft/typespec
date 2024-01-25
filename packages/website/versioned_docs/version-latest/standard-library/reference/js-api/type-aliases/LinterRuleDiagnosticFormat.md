---
jsApi: true
title: "[T] LinterRuleDiagnosticFormat"

---
```ts
type LinterRuleDiagnosticFormat<T, M>: T[M] extends CallableMessage<infer A> ? Object : Record<string, unknown>;
```

## Type parameters

| Parameter | Value |
| :------ | :------ |
| `T` extends [`DiagnosticMessages`](../interfaces/DiagnosticMessages.md) | - |
| `M` extends keyof `T` | `"default"` |
