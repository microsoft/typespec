---
changeKind: fix
packages:
  - "@typespec/http-specs"
---

Fix float comparison in duration encode mockapi for query and header params to use numeric comparison instead of string comparison, allowing values like `35625.0` to match `35625`