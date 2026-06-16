---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Add a `keep-pyproject-fields` emitter option that takes a comma-separated list of `[project]` fields to preserve in an existing `pyproject.toml` instead of overwriting them on regeneration. Supported fields: `authors`, `description`, `classifiers`, `urls`.

```yaml
# tspconfig.yaml
options:
  "@typespec/http-client-python":
    keep-pyproject-fields: "authors,description"
```
