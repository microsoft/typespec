---
jsApi: true
title: "[T] LinterRuleDiagnosticFormat"

---
```ts
type LinterRuleDiagnosticFormat<T, M>: T[M] extends CallableMessage<infer A> ? object : Record<string, unknown>;
```

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` extends [`DiagnosticMessages`](../interfaces/DiagnosticMessages.md) | - |
| `M` extends keyof `T` | `"default"` |
