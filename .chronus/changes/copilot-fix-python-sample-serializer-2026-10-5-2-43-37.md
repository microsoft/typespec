---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix invalid string literals in generated Python samples for quoted If-Match ETags, preserving the exact header value.