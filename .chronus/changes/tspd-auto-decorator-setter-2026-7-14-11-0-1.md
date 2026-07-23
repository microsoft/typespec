---
changeKind: feature
packages:
  - "@typespec/tspd"
---

`tspd gen-extern-signature` now also generates a typed setter (e.g. `setMyFlag`, `setMyLabel`) for each `auto` decorator, alongside the existing `is*`/`get*` readers.
