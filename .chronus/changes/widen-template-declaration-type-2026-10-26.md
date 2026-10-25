---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Widen `isTemplateDeclaration` and `isTemplateDeclarationOrInstance` to accept any `Type`.

```ts
import { isTemplateDeclaration, isTemplateDeclarationOrInstance } from "@typespec/compiler";

if (isTemplateDeclaration(someType)) {
  // ...
}

if (isTemplateDeclarationOrInstance(someType)) {
  // ...
}
```
