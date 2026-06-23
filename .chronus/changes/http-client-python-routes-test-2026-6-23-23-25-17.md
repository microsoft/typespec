---
changeKind: internal
packages:
  - "@typespec/http-client-python"
---

Update `@typespec/http-specs` to `0.1.0-alpha.39-dev.3` which includes the fix for swapped `Routes_fixed` and `Routes_InInterface` mock API URIs (from #10978). The existing `test_fixed` and `test_in_interface_fixed` tests in `test_routes.py` now correctly validate against the proper routes.
