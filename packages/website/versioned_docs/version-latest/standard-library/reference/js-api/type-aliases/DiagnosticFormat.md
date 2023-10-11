---
jsApi: true
title: "[T] DiagnosticFormat"

---
```ts
type DiagnosticFormat<T, C, M>: T[C][M] extends CallableMessage<infer A> ? object : Record<string, unknown>;
```

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` extends `object` | - |
| `C` extends keyof `T` | - |
| `M` extends keyof `T`[`C`] | `"default"` |
