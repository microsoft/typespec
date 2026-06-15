---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Add a `keep-pyproject-fields` emitter option that, when enabled, preserves manually customized `authors`, `description`, `classifiers`, and `[project.urls]` fields in an existing `pyproject.toml` instead of overwriting them on regeneration.

```yaml
# tspconfig.yaml
options:
  "@typespec/http-client-python":
    keep-pyproject-fields: true
```
