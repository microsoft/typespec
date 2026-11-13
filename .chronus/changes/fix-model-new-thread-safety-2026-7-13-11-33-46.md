---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix a race condition in the generated `_model_base.py` where concurrent first-time model construction could raise `RuntimeError: dictionary changed size during iteration` in `Model.__new__`. Because deserialization swallows that error, affected responses were silently returned as raw dicts (or models with raw-dict nested fields) instead of deserialized models. The lazy metadata initialization is now thread-safe without locks: it iterates a snapshot of each class `__dict__` and publishes `_attr_to_rest_field` atomically, guarded by the class's own `__dict__`.
