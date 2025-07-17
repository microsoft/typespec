---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

Fixed an issue where JSON serialization would not correctly handle optional properties in some cases.

Fixed an issue where body serialization would sometimes fail to name anonymous response items, even if a name is required
to dispatch serialization code.
