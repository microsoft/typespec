---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Expose `skipTrivia` through `@typespec/compiler/ast` so codefixes can reuse the compiler whitespace and comment handling.

```ts
import { skipTrivia } from "@typespec/compiler/ast";

const cursor = skipTrivia(sourceText, property.end, property.parent?.end);
```