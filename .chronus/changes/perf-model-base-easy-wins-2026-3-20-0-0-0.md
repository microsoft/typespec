---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Speed up model deserialization for list-style operations by precomputing per-class defaults and rest-name metadata once in `__new__`, turning `_RestField._rest_name` and `Model._calculated_done` into plain attribute reads instead of a `@property` and a string-keyed set lookup. Also narrows a broad `except Exception` in `_deserialize_default` to `except DeserializationError` so real coding bugs are no longer silently swallowed.
