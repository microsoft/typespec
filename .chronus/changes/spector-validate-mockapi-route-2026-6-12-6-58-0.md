---
changeKind: fix
packages:
  - "@typespec/spector"
---

`validate-mock-apis` now verifies that the `uri` of each mock API definition is consistent with the route defined in the corresponding `main.tsp`, so a mismatch between the spec route and the mock api uri is detected by CI.
