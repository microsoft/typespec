---
jsApi: true
title: "[T] TypeOfDiagnostics"

---
```ts
type TypeOfDiagnostics<T>: T extends DiagnosticMap<infer D> ? D : never;
```

## Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`DiagnosticMap`](DiagnosticMap.md)<`any`\> |
