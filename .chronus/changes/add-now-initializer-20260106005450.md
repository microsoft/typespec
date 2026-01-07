---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add `now()` initializer to date/time scalars (`plainDate`, `plainTime`, `utcDateTime`, `offsetDateTime`) for indicating current date/time at runtime. Emitters should interpret this as the appropriate runtime value (e.g., database `CURRENT_TIMESTAMP`, JavaScript `Date.now()`, etc.).
