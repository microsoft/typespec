---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Generate required `If-Match` headers as direct `if_match` parameters instead of
the optional `etag` and `match_condition` convenience API.
