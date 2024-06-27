---
jsApi: true
title: "[T] InferredTypeSpecValue"

---
```ts
type InferredTypeSpecValue<K>: K extends "Any" ? TypeSpecValue : K extends infer T[] ? InferredTypeSpecValue<T> : K extends "String" ? string : K extends "Number" ? number : K extends "Boolean" ? boolean : Type & object;
```

## Type parameters

| Type parameter |
| :------ |
| `K` *extends* [`TypeKind`](TypeKind.md) |
