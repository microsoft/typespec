---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Escape a leading `@` in wire names used as Sphinx docstring field targets (e.g. `:vartype @search.facets:`) so the generated docstrings for models, TypedDicts, operations, and clients render correctly.
