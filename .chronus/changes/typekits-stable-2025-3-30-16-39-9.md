---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Typekits have been moved out of experimental and can now be accessed via the `@typespec/compiler/typekit` submodule.
This also removed the `$.type.getDiscriminator` typekit in favor of the `$.model.getDiscriminatedUnion` and `$.union.getDiscriminatedUnion`
typkits.

```diff
-import { $ } from "@typespec/compiler/experimental/typekit";
+import { $ } from "@typespec/compiler/typekit";
```
