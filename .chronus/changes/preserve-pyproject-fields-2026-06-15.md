---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Preserve manually customized `description`, `classifiers`, and `[project.urls]` fields in an existing `pyproject.toml` instead of overwriting them on regeneration.
