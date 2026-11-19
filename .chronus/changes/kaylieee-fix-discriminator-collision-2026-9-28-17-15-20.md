---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Fix code model parse "immediate" and "all" tags. Restrict special case handling to mappings whose expected Java type is Relations or Discriminator