---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Prevent service-defined YAML map keys, such as discriminator value `responses`, from being interpreted as code-model properties.
