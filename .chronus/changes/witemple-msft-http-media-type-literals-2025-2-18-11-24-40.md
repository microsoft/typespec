---
changeKind: fix
packages:
  - "@typespec/http"
---

HTTP Media type resolution logic now treats literal types (String, Boolean, Numeric, and StringTemplate types) as equivalent to their given scalar types for the purposes of resolving their Media Type.