---
changeKind: feature
packages:
  - "@typespec/http-server-javascript"
---

- Implemented new-style multipart request handling.
- Fixed JSON serialization/deserialization in some cases where models that required serialization occurred within arrays.
