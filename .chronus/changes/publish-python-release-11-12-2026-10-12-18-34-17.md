---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix invalid TypedDict inheritance when a derived model narrows an inherited property type.

Avoid unused union imports when authentication alternatives share the same Python credential type.