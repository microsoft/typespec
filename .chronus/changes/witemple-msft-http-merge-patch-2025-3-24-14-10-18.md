---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Weakened rules around `@mediaTypeHint` decorator, allowing media type hints with suffixes like "application/merge-patch+json".