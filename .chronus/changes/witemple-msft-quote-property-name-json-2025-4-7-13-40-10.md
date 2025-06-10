---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

Fixed an issue in which differences between model and JSON serialized property names were not correctly detected and property names for JSON serialization were not correctly quoted as necessary.