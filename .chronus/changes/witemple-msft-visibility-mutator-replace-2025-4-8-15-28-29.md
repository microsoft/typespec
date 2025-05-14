---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Corrected visibility filtering logic to even more aggressively deduplicate the models it visits when the applied visibility transform does not actually remove any properties from a model.