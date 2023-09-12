---
jsApi: true
title: "[T] InferredTypeSpecValue"

---
```ts
InferredTypeSpecValue: <K> K extends "Any" ? TypeSpecValue : K extends infer T[] ? InferredTypeSpecValue< T > : K extends "String" ? string : K extends "Number" ? number : K extends "Boolean" ? boolean : Type & {kind: K;}
```

## Type parameters

| Parameter |
| :------ |
| `K` *extends* [`TypeKind`](Type.TypeKind.md) |
