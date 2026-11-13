---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Linter diagnostics on a library declaration are no longer always dropped. When the project is responsible for the declaration being there, the diagnostic is reported on that node instead: the template argument the property's type came from, or the spread, `is` or intersection operand that composed it in. A library can still `#suppress` a diagnostic on its own declaration to keep it from being reported in projects.
