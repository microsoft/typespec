---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Handle tagged descendants behind untagged intermediate models, including nested discriminator hierarchies, without inventing discriminator values, omitting classes, or losing inherited properties.
