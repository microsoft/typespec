---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

fix: handle Enum type in JSON serialization transpose helpers to prevent crash when a model with an enum property requires a JSON serializer
