---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Handle tagged descendants behind untagged intermediate models, including cross-package and nested discriminator hierarchies, without inventing tags or losing inherited JSON/XML properties.
