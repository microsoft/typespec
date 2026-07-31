---
changeKind: feature
packages:
  - "@typespec/tspd"
---

`tspd doc` now generates a documentation page per linter rule (`reference/rules/<name>.md`) and per diagnostic (`reference/diagnostics/<code>.md`), sourced from the `docs` field on the rule and diagnostic definitions. A `documentation-missing` warning is reported for any linter rule or diagnostic that does not provide documentation.
