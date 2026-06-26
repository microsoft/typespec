---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix trailing path separator emitted for an optional path parameter when its value is null. A route like `/items/{name}/{version}` with an optional `version` now produces `/items/{name}` instead of `/items/{name}/` when `version` is not provided.
