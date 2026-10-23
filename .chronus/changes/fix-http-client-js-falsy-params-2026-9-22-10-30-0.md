---
changeKind: fix
packages:
  - "@typespec/http-client-js"
---

Send optional path, query and header parameters whose value is falsy, such as `0`, `""` or `false`. The guard now checks for `undefined` instead of truthiness.
