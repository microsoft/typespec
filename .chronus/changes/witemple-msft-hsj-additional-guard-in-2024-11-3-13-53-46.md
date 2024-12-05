---
changeKind: fix
packages:
  - "@typespec/http-server-javascript"
---

Added an additional check for the presence of a property before performing a bounds check on integer properties constrained to a range.