---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Convert custom etag-typed headers (e.g. `x-ms-blob-if-match`) to `etag`/`match_condition` parameters, matching the standard `If-Match`/`If-None-Match` behavior while preserving the original wire name for the HTTP header
