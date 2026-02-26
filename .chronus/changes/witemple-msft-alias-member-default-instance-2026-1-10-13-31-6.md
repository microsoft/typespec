---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fixed an issue where referencing a member of a templated alias with defaultable parameters would fail to instantiate the alias, leaking template parameters.