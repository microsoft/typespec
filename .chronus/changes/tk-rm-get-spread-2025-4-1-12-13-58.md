---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Replaces `$.model.getSpreadType` with `$.model.getIndexType` to better reflect what it actually being returned. `getSpreadType` did not actually return a list of spread types, but the model's indexer type instead.