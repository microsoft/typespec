---
jsApi: true
title: "[T] LinterRuleDiagnosticFormat"

---
```ts
type LinterRuleDiagnosticFormat<T, M>: T[M] extends CallableMessage<infer A> ? object : Record<string, unknown>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`DiagnosticMessages`](../interfaces/DiagnosticMessages.md) | - |
| `M` *extends* keyof `T` | `"default"` |
