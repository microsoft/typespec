---
jsApi: true
title: "[T] DiagnosticFormat"

---
```ts
type DiagnosticFormat<T, C, M>: T[C][M] extends CallableMessage<infer A> ? Object : Record<string, unknown>;
```

## Type parameters

| Parameter | Value |
| :------ | :------ |
| `T` extends `Object` | - |
| `C` extends keyof `T` | - |
| `M` extends keyof `T`\[`C`\] | `"default"` |
