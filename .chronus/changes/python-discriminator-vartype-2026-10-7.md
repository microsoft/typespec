---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix the `:vartype` docstring of constant enum values (such as discriminator properties on polymorphic subclasses) to reference the enum class instead of a non-existent module-level symbol named after the enum member.
