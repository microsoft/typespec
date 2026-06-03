---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Emit a clear error diagnostic when `valueof` is used in a scalar initializer parameter constraint. Scalar initializer parameters implicitly accept values, so `valueof` is redundant and was previously causing confusing errors.
