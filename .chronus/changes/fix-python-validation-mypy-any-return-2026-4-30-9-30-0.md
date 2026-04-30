---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix mypy `[no-any-return]` error in generated `_validation.py` by typing `api_versions_list` as `list[str]` so `_index_with_default` returns `int` rather than `Any`.
