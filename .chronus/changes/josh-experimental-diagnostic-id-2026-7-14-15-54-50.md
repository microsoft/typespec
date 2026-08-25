---
changeKind: feature
packages:
  - "@typespec/http-client"
---

Add diagnostic and dependency metadata to `@experimental`.

```typespec
@experimental(#{ diagnosticId: "C", dependsOn: #["A", "B"] })
op bar(): void;
```