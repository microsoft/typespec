---
jsApi: true
title: "[T] LinterRuleDiagnosticFormat"

---
```ts
type LinterRuleDiagnosticFormat<T, M>: T[M] extends CallableMessage<infer A> ? object : Record<string, unknown>;
```

## Type parameters

| Type parameter | Value |
| :------ | :------ |
| `T` *extends* [`DiagnosticMessages`](../interfaces/DiagnosticMessages.md) | - |
| `M` *extends* keyof `T` | `"default"` |
