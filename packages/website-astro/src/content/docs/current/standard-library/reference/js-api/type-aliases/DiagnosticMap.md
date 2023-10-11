---
jsApi: true
title: "[T] DiagnosticMap"

---
```ts
type DiagnosticMap<T>: { readonly [code in keyof T]: DiagnosticDefinition<T[code]> };
```

## Type parameters

| Parameter |
| :------ |
| `T` extends `object` |
