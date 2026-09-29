---
changeKind: fix
packages:
  - "@typespec/graphql"
---

Set the required `expression` field to `false` when creating a replacement scalar so scalars produced by the model mutation engine are valid declaration types.
