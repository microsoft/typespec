---
changeKind: deprecation
packages:
  - "@typespec/compiler"
---

`getDiscriminatedUnionFromInheritance(type, discriminator)` is deprecated. Pass the program as the first argument so enum member discriminator values use their `@encodedName`.

```ts
const [union, diagnostics] = getDiscriminatedUnionFromInheritance(program, type, discriminator);
```
