---
changeKind: feature
packages:
  - "@typespec/tspd"
---

`tspd doc` now generates a documentation page per linter rule (`reference/rules/<name>.md`) and per diagnostic (`reference/diagnostics/<code>.md`) plus a diagnostics index, sourced from the `docs` field on the definitions. A `documentation-missing` warning is now also reported for linter rules and diagnostics without documentation.
