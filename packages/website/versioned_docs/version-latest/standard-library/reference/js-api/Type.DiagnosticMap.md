---
jsApi: true
title: "[T] DiagnosticMap"

---
```ts
DiagnosticMap: <T> { readonly [code in keyof T]: DiagnosticDefinition<T[code]> }
```

## Type parameters

| Parameter |
| :------ |
| `T` *extends* \{} |
