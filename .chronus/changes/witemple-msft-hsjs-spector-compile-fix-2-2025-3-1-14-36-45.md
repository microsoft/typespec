---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

Correct implementation of JSON body deserialization when the body type is an array or record requiring interior serialization/deserialization.
