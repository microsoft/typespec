---
jsApi: true
title: "[T] DiagnosticMap"

---
```ts
type DiagnosticMap<T>: { readonly [code in keyof T]: DiagnosticDefinition<T[code]> };
```

## Type parameters

| Type parameter |
| :------ |
| `T` *extends* `object` |
