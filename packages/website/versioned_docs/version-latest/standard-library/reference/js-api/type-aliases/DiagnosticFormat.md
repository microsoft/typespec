---
jsApi: true
title: "[T] DiagnosticFormat"

---
```ts
type DiagnosticFormat<T, C, M>: T[C][M] extends CallableMessage<infer A> ? object : Record<string, unknown>;
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* `object` | - |
| `C` *extends* keyof `T` | - |
| `M` *extends* keyof `T`\[`C`\] | `"default"` |
