---
jsApi: true
title: "[T] DiagnosticFormat"

---
```ts
DiagnosticFormat: <T, C, M> T[C][M] extends CallableMessage< infer A > ? {format: Record< A[number], string >;} : Record< string, unknown >
```

## Type parameters

| Parameter | Default |
| :------ | :------ |
| `T` *extends* \{} | - |
| `C` *extends* *keyof* `T` | - |
| `M` *extends* *keyof* `T`[`C`] | `"default"` |
