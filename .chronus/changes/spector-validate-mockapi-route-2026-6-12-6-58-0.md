---
changeKind: fix
packages:
  - "@typespec/spector"
---

`validate-mock-apis` now verifies that every route defined in a scenario's `main.tsp` is served by at least one of the scenario's mock API `uri`s, so a mismatch between the spec route and the mock api uri (which would make a generated client get a 404 from the mock server) is detected by CI.
