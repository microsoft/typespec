---
changeKind: internal
packages:
  - "@typespec/http-client-python"
---

Fix CI on main by deleting README.md files during baseline reset so regeneration recreates them; extend unit test to assert README.md exists for every generated SDK package (azure & unbranded).
