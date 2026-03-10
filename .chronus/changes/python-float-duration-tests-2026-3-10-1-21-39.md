---
changeKind: internal
packages:
  - "@typespec/http-client-python"
---

Add test cases for float duration encode scenarios in query and header params, covering `float_milliseconds`, `float64_milliseconds`, `float_seconds_larger_unit`, and `float_milliseconds_larger_unit` with whole-number float values (e.g. `35625.0`) that require numeric comparison.
