---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Wrap wire names containing `@` (e.g. `@search.facets`) in double backticks when they are used as Sphinx docstring field targets (`:ivar`/`:vartype`/`:keyword`/`:paramtype`/`:param`/`:type`) across models, TypedDicts, operations, and clients, so the generated docstrings render correctly without introducing an invalid escape sequence in the generated code.
