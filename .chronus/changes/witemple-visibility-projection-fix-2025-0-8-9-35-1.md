---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Enum-driven visibility decorators and projections now interact correctly.

Projections now project EnumValue values to preserve consistency with projected Enum/EnumMember types using a best-effort
strategy.
