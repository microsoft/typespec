---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix `UnboundLocalError` for paging operations with a flattened JSON model body. The request body is now constructed once outside the `prepare_request` callback (and before the body is serialized into the request content) instead of inside the closure, where assigning `body` made it an unbound local on every page fetch.
