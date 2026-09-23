---
changeKind: feature
packages:
  - "@typespec/http-specs"
---

Add named-model query parameter scenarios for standard expansion, standard continuation, and exploded continuation.

```typespec
model ExpandParameters {
  field: string;
  value: string;
}
```
