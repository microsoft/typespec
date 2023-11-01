---
jsApi: true
title: "[T] EmitOptionsFor"

---
```ts
type EmitOptionsFor<C>: C extends TypeSpecLibrary<infer _T, infer E> ? E : never;
```

Get the options for the onEmit of this library.

## Type parameters

| Parameter |
| :------ |
| `C` |
