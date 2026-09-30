---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Stop raising an internal compiler error when `@example` receives an integer that cannot be represented exactly as a JavaScript number (for example a large `int64`). Marshalling now keeps the value as `Numeric` instead of asserting.
