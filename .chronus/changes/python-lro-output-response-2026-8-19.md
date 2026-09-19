---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Bind `response` in the generated LRO `get_long_running_output` callback whenever its deserialization reads it, fixing a `NameError` for `models-mode: none` clients whose final LRO response has a body but no headers.
