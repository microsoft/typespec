---
changeKind: internal
packages:
  - "@typespec/http-client-python"
---

Fix `run_batch.py` passing string `"true"`/`"false"` values to pygen, which caused `keep-setup-py="false"` to be treated as truthy and generate `setup.py` instead of `pyproject.toml` for all regenerated test packages.
