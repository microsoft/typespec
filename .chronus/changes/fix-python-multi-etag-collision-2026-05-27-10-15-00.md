---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix `etag`/`match_condition` clientName collision when an operation has more than one `Azure.Core.eTag`-typed header (e.g. Storage's `copyFromUrl`, which has both `If-Match`/`If-None-Match` and `x-ms-source-if-match`/`x-ms-source-if-none-match`). The standard `If-Match`/`If-None-Match` pair is now preferred for the `etag`/`match_condition` slot, and any additional etag-typed headers retain their natural client name (e.g. `source_if_match`).
